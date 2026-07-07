const Task = require('../models/Task');
const {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require('../services/googleCalendar');

const isGoogleConnected = (user) => !!user.googleTokens?.refresh_token;

// @desc    Get all tasks for logged in user
// @route   GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.course) {
      filter.course = req.query.course;
    }
    const tasks = await Task.find(filter)
      .populate('course', 'name color')
      .sort({ deadline: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, course, deadline, priority } = req.body;
    const task = await Task.create({
      user: req.user._id,
      title,
      course,
      deadline,
      priority,
    });

    const populated = await task.populate('course', 'name color');

    if (isGoogleConnected(req.user)) {
      try {
        const eventId = await createCalendarEvent(req.user, populated);
        populated.googleEventId = eventId;
        await populated.save();
      } catch (err) {
        console.error('[google] create event failed:', err.message);
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('course', 'name color');

    if (isGoogleConnected(req.user)) {
      try {
        if (updated.googleEventId) {
          await updateCalendarEvent(req.user, updated.googleEventId, updated);
        } else {
          const eventId = await createCalendarEvent(req.user, updated);
          updated.googleEventId = eventId;
          await updated.save();
        }
      } catch (err) {
        console.error('[google] update event failed:', err.message);
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (isGoogleConnected(req.user) && task.googleEventId) {
      try {
        await deleteCalendarEvent(req.user, task.googleEventId);
      } catch (err) {
        console.error('[google] delete event failed:', err.message);
      }
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== Subtask handlers =====

// Helper to load a task and verify ownership
const findOwnedTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) return { error: 'notfound' };
  if (task.user.toString() !== userId.toString()) return { error: 'unauthorized' };
  return { task };
};

// @desc    Add a subtask
// @route   POST /api/tasks/:id/subtasks
const addSubtask = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Subtask title is required' });
    }

    const { task, error } = await findOwnedTask(req.params.id, req.user._id);
    if (error === 'notfound') return res.status(404).json({ message: 'Task not found' });
    if (error === 'unauthorized') return res.status(401).json({ message: 'Not authorized' });

    task.subtasks.push({ title: title.trim(), completed: false });
    await task.save();

    const populated = await task.populate('course', 'name color');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle a subtask's completed state
// @route   PUT /api/tasks/:id/subtasks/:subtaskId
const toggleSubtask = async (req, res) => {
  try {
    const { task, error } = await findOwnedTask(req.params.id, req.user._id);
    if (error === 'notfound') return res.status(404).json({ message: 'Task not found' });
    if (error === 'unauthorized') return res.status(401).json({ message: 'Not authorized' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    subtask.completed = !subtask.completed;
    await task.save();

    const populated = await task.populate('course', 'name color');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a subtask
// @route   DELETE /api/tasks/:id/subtasks/:subtaskId
const deleteSubtask = async (req, res) => {
  try {
    const { task, error } = await findOwnedTask(req.params.id, req.user._id);
    if (error === 'notfound') return res.status(404).json({ message: 'Task not found' });
    if (error === 'unauthorized') return res.status(401).json({ message: 'Not authorized' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    subtask.deleteOne();
    await task.save();

    const populated = await task.populate('course', 'name color');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
};