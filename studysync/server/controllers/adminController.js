const User = require('../models/User');
const Course = require('../models/Course');
const Task = require('../models/Task');
const { sendReminders } = require('../utils/sendReminders');

// @desc    Get platform-wide statistics
// @route   GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      totalAdmins,
      totalCourses,
      totalTasks,
      completedTasks,
      recentSignups,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments(),
      Task.countDocuments(),
      Task.countDocuments({ completed: true }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    res.json({
      totalUsers,
      totalAdmins,
      totalCourses,
      totalTasks,
      completedTasks,
      recentSignups,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users with aggregated course/task counts
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const [courseCount, taskCount] = await Promise.all([
          Course.countDocuments({ user: user._id }),
          Task.countDocuments({ user: user._id }),
        ]);
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          courseCount,
          taskCount,
        };
      })
    );

    res.json(usersWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user (and cascade their courses + tasks)
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Promise.all([
      Course.deleteMany({ user: userId }),
      Task.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({ message: 'User and all associated data deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Promote or demote a user
// @route   PUT /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manually trigger sending reminder emails (admin only)
// @route   POST /api/admin/send-reminders
const triggerReminders = async (req, res) => {
  try {
    const result = await sendReminders();
    res.json({
      message: 'Reminders processed.',
      ...result,
    });
  } catch (error) {
    console.error('[admin] sendReminders error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStats, getAllUsers, deleteUser, updateUserRole, triggerReminders };