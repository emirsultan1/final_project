const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a course name'],
    trim: true,
  },
  color: {
    type: String,
    default: '#4f46e5',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Course', courseSchema);
