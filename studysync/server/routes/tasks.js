const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} = require('../controllers/taskController');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

// Subtask routes
router.post('/:id/subtasks', addSubtask);
router.put('/:id/subtasks/:subtaskId', toggleSubtask);
router.delete('/:id/subtasks/:subtaskId', deleteSubtask);

module.exports = router;