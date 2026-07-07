const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('StudySession', studySessionSchema);