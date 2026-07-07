const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  deleteGroup,
  addGoal,
  toggleGoal,
  deleteGoal,
} = require('../controllers/groupController');

router.use(protect);

router.get('/', getMyGroups);
router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/:id', getGroup);
router.post('/:id/leave', leaveGroup);
router.delete('/:id', deleteGroup);

router.post('/:id/goals', addGoal);
router.put('/:id/goals/:goalId', toggleGoal);
router.delete('/:id/goals/:goalId', deleteGoal);

module.exports = router;