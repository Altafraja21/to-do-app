// models/Todo.js
const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'shopping', 'health', 'education', 'general'],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true
  }],
  dueDate: {
    type: Date
  },
  reminder: {
    type: Date
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // SHARING FIELDS - ADD THESE
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better performance
todoSchema.index({ user: 1, createdAt: -1 });
todoSchema.index({ 'sharedWith.user': 1 });
todoSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Todo', todoSchema);