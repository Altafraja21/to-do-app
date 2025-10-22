const express = require('express');
const Todo = require('../models/Todo');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// @desc    Share a todo with other users
// @route   POST /api/sharing/:id/share
// @access  Private
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { email, permission = 'view' } = req.body;
    
    // Find the todo
    const todo = await Todo.findOne({ 
      _id: req.params.id, 
      $or: [
        { user: req.user.id },
        { createdBy: req.user.id }
      ]
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found or you dont have permission to share it'
      });
    }

    // Find the user to share with
    const userToShareWith = await User.findOne({ email });
    if (!userToShareWith) {
      return res.status(404).json({
        success: false,
        message: 'User not found with that email'
      });
    }

    // Can't share with yourself
    if (userToShareWith._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot share todo with yourself'
      });
    }

    // Check if already shared with this user
    const alreadyShared = todo.sharedWith.some(share => 
      share.user.toString() === userToShareWith._id.toString()
    );

    if (alreadyShared) {
      return res.status(400).json({
        success: false,
        message: 'Todo already shared with this user'
      });
    }

    // Add to sharedWith array
    todo.sharedWith.push({
      user: userToShareWith._id,
      permission
    });
    
    todo.isShared = true;
    await todo.save();

    res.json({
      success: true,
      message: `Todo shared successfully with ${email}`,
      data: todo
    });
  } catch (error) {
    console.error('Share todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing todo'
    });
  }
});

// @desc    Get todos shared with me
// @route   GET /api/sharing/shared-with-me
// @access  Private
router.get('/shared-with-me', auth, async (req, res) => {
  try {
    const sharedTodos = await Todo.find({
      'sharedWith.user': req.user.id
    })
    .populate('user', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: sharedTodos
    });
  } catch (error) {
    console.error('Get shared todos error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shared todos'
    });
  }
});

// @desc    Get todos I've shared with others
// @route   GET /api/sharing/shared-by-me
// @access  Private
router.get('/shared-by-me', auth, async (req, res) => {
  try {
    const sharedTodos = await Todo.find({
      createdBy: req.user.id,
      isShared: true
    })
    .populate('sharedWith.user', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: sharedTodos
    });
  } catch (error) {
    console.error('Get my shared todos error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching todos shared by you'
    });
  }
});

// @desc    Update shared todo permission
// @route   PUT /api/sharing/:id/permission
// @access  Private
router.put('/:id/permission', auth, async (req, res) => {
  try {
    const { userId, permission } = req.body;

    const todo = await Todo.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found or you dont have permission to modify sharing'
      });
    }

    const shareIndex = todo.sharedWith.findIndex(share => 
      share.user.toString() === userId
    );

    if (shareIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found in shared list'
      });
    }

    todo.sharedWith[shareIndex].permission = permission;
    await todo.save();

    res.json({
      success: true,
      message: 'Permission updated successfully',
      data: todo
    });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permission'
    });
  }
});

// @desc    Remove sharing
// @route   DELETE /api/sharing/:id/share
// @access  Private
router.delete('/:id/share', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    const todo = await Todo.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user.id },
        { user: req.user.id }
      ]
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found or no permission'
      });
    }

    // Remove the specific user from sharedWith
    todo.sharedWith = todo.sharedWith.filter(share => 
      share.user.toString() !== userId
    );

    // If no more shared users, set isShared to false
    if (todo.sharedWith.length === 0) {
      todo.isShared = false;
    }

    await todo.save();

    res.json({
      success: true,
      message: 'Sharing removed successfully',
      data: todo
    });
  } catch (error) {
    console.error('Remove sharing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing sharing'
    });
  }
});

module.exports = router;