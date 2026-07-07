const StudySession = require('../models/StudySession');

// @desc    Get all study sessions for logged in user
// @route   GET /api/sessions
const getSessions = async (req, res) => {
  try {
    const sessions = await StudySession.find({ user: req.user._id })
      .populate('course', 'name color')
      .sort({ completedAt: -1 })
      .limit(50);

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a study session (called when a focus pomodoro completes)
// @route   POST /api/sessions
const createSession = async (req, res) => {
  try {
    const { course, duration } = req.body;

    if (!duration || duration < 1) {
      return res.status(400).json({ message: 'Duration is required' });
    }

    const session = await StudySession.create({
      user: req.user._id,
      course: course || null,
      duration,
    });

    const populated = await session.populate('course', 'name color');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get session stats (today + all-time)
// @route   GET /api/sessions/stats
const getSessionStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [allSessions, todaySessions] = await Promise.all([
      StudySession.find({ user: req.user._id }),
      StudySession.find({ user: req.user._id, completedAt: { $gte: startOfDay } }),
    ]);

    const totalSessions = allSessions.length;
    const totalSeconds = allSessions.reduce((sum, s) => sum + s.duration, 0);

    const todaySessionCount = todaySessions.length;
    const todaySeconds = todaySessions.reduce((sum, s) => sum + s.duration, 0);

    res.json({
      totalSessions,
      totalMinutes: Math.floor(totalSeconds / 60),
      todaySessions: todaySessionCount,
      todayMinutes: Math.floor(todaySeconds / 60),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSessions, createSession, getSessionStats };