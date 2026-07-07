const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getGoogleAuthUrl,
  googleCallback,
  disconnectGoogle,
  getGoogleStatus,
} = require('../controllers/googleController');

// Callback is hit by Google's browser redirect — no JWT, the user is
// identified via the `state` param. So it must NOT be behind `protect`.
router.get('/callback', googleCallback);

// Everything else requires the user to be logged in.
router.get('/auth-url', protect, getGoogleAuthUrl);
router.get('/status', protect, getGoogleStatus);
router.post('/disconnect', protect, disconnectGoogle);

module.exports = router;