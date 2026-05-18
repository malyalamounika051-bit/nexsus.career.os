const express = require('express');
const router = express.Router();
const passport = require('passport');
const { register, login, verifyLoginOtp, getMe, updateProfile, demoLogin, oauthSuccess, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Standard auth
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyLoginOtp);
router.post('/demo', demoLogin);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
const { googleConfigured } = require('../config/passport');

if (googleConfigured) {
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );
  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
    oauthSuccess
  );
} else {
  // Friendly message when OAuth not configured
  router.get('/google', (req, res) => {
    res.status(503).json({ success: false, message: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.' });
  });
}

module.exports = router;
