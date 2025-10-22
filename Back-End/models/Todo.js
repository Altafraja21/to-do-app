const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a todo title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
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
    trim: true,
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
  remindersSent: {
    type: [String],
    default: []
  },
  // Sharing fields
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create index for better query performance
todoSchema.index({ user: 1, createdAt: -1 });
todoSchema.index({ user: 1, category: 1 });
todoSchema.index({ user: 1, tags: 1 });
todoSchema.index({ reminder: 1 });
todoSchema.index({ dueDate: 1 });
todoSchema.index({ 'sharedWith.user': 1 });
todoSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Todo', todoSchema);