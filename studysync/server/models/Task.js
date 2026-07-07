const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true,
  },
  deadline: {
    type: Date,
    required: [true, 'Please provide a deadline'],
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  completed: {
    type: Boolean,
    default: false,
  },
  googleEventId: {
    type: String,
    default: null,
  },
  subtasks: [subtaskSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Task', taskSchema);