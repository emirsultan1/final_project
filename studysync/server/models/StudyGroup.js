const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a group name'],
    trim: true,
    maxlength: 60,
  },
  joinCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  goals: [goalSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('StudyGroup', studyGroupSchema);