const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const {
  getStats,
  getAllUsers,
  deleteUser,
  updateUserRole,
  triggerReminders,
} = require('../controllers/adminController');

router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);
router.post('/send-reminders', triggerReminders);

module.exports = router;