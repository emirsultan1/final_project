const User = require('../models/User');
const {
  getAuthUrl,
  exchangeCodeForTokens,
} = require('../services/googleCalendar');

// @desc    Get the Google OAuth consent URL for the current user
// @route   GET /api/google/auth-url
const getGoogleAuthUrl = async (req, res) => {
  try {
    const url = getAuthUrl(req.user._id);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    OAuth callback — Google redirects here with a code
// @route   GET /api/google/callback
const googleCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    if (error) {
      return res.redirect(`${clientUrl}/settings?google=denied`);
    }

    if (!code || !state) {
      return res.redirect(`${clientUrl}/settings?google=error`);
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // state is the StudySync user ID we passed in originally
    const user = await User.findById(state);
    if (!user) {
      return res.redirect(`${clientUrl}/settings?google=error`);
    }

    // Save tokens on the user. Important: Google only returns refresh_token
    // on the FIRST authorization. If user re-auths and we get null
    // refresh_token, keep the existing one.
    user.googleTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || user.googleTokens?.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
    };
    await user.save();

    return res.redirect(`${clientUrl}/settings?google=connected`);
  } catch (error) {
    console.error('[google] callback error:', error.message);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    return res.redirect(`${clientUrl}/settings?google=error`);
  }
};

// @desc    Disconnect Google Calendar — drops tokens
// @route   POST /api/google/disconnect
const disconnectGoogle = async (req, res) => {
  try {
    req.user.googleTokens = {
      access_token: null,
      refresh_token: null,
      scope: null,
      token_type: null,
      expiry_date: null,
    };
    await req.user.save();
    res.json({ message: 'Google Calendar disconnected.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current connection status
// @route   GET /api/google/status
const getGoogleStatus = async (req, res) => {
  const connected = !!req.user.googleTokens?.refresh_token;
  res.json({ connected });
};

module.exports = {
  getGoogleAuthUrl,
  googleCallback,
  disconnectGoogle,
  getGoogleStatus,
};