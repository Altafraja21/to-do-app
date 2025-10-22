const express = require('express');
const Todo = require('../models/Todo');
const auth = require('../middleware/auth');
const router = express.Router();

// @desc    Get all todos for user
// @route   GET /api/todos
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category, priority, completed, tag } = req.query;
    
    // Build query
    let query = { user: req.user.id };
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    // Filter by completion status
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }
    
    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    const todos = await Todo.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: todos.length,
      data: todos
    });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching todos'
    });
  }
});

// @desc    Get single todo
// @route   GET /api/todos/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      _id: req.params.id, 
      $or: [
        { user: req.user.id },
        { 'sharedWith.user': req.user.id }
      ]
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    console.error('Get todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching todo'
    });
  }
});

// @desc    Create new todo
// @route   POST /api/todos
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, category, tags, dueDate, reminder } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a title for the todo'
      });
    }

    // Create todo
    const todo = await Todo.create({
      title,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      tags: tags || [],
      dueDate,
      reminder,
      user: req.user.id,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: todo
    });
  } catch (error) {
    console.error('Create todo error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating todo'
    });
  }
});

// @desc    Update todo
// @route   PUT /api/todos/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    // Make sure user owns the todo or has edit permission
    const canEdit = todo.user.toString() === req.user.id || 
                   todo.sharedWith.some(share => 
                     share.user.toString() === req.user.id && 
                     share.permission === 'edit'
                   );

    if (!canEdit) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this todo'
      });
    }

    todo = await Todo.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating todo'
    });
  }
});

// @desc    Delete todo
// @route   DELETE /api/todos/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    // Make sure user owns the todo (only owner can delete, not shared users)
    if (todo.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this todo'
      });
    }

    await Todo.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Todo removed successfully'
    });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting todo'
    });
  }
});

// @desc    Share todo with another user
// @route   POST /api/todos/:id/share
// @access  Private
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { userId, permission = 'view' } = req.body;
    
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    // Make sure user owns the todo
    if (todo.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to share this todo'
      });
    }

    // Check if already shared with this user
    const alreadyShared = todo.sharedWith.some(share => 
      share.user.toString() === userId
    );

    if (alreadyShared) {
      return res.status(400).json({
        success: false,
        message: 'Todo already shared with this user'
      });
    }

    // Add to sharedWith array
    todo.sharedWith.push({
      user: userId,
      permission
    });
    
    todo.isShared = true;
    await todo.save();

    res.json({
      success: true,
      message: 'Todo shared successfully',
      data: todo
    });
  } catch (error) {
    console.error('Share todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sharing todo'
    });
  }
});

// @desc    Get shared todos
// @route   GET /api/todos/shared/with-me
// @access  Private
router.get('/shared/with-me', auth, async (req, res) => {
  try {
    const sharedTodos = await Todo.find({
      'sharedWith.user': req.user.id
    }).populate('user', 'name email').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: sharedTodos.length,
      data: sharedTodos
    });
  } catch (error) {
    console.error('Get shared todos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching shared todos'
    });
  }
});

module.exports = router;