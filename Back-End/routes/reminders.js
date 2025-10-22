const express = require('express');
const Todo = require('../models/Todo');
const auth = require('../middleware/auth');
const router = express.Router();

// @desc    Get upcoming reminders
// @route   GET /api/reminders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingReminders = await Todo.find({
      user: req.user.id,
      reminder: {
        $gte: now,
        $lte: next24Hours
      },
      completed: false
    }).sort({ reminder: 1 });

    res.json({
      success: true,
      count: upcomingReminders.length,
      data: upcomingReminders
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reminders'
    });
  }
});

// @desc    Get overdue todos
// @route   GET /api/reminders/overdue
// @access  Private
router.get('/overdue', auth, async (req, res) => {
  try {
    const now = new Date();

    const overdueTodos = await Todo.find({
      user: req.user.id,
      dueDate: {
        $lt: now
      },
      completed: false
    }).sort({ dueDate: 1 });

    res.json({
      success: true,
      count: overdueTodos.length,
      data: overdueTodos
    });
  } catch (error) {
    console.error('Get overdue todos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching overdue todos'
    });
  }
});

module.exports = router;