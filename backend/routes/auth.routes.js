const express = require('express');
const {
  register, login, logout, me, verifyEmail, resendVerification, forgotPassword, resetPassword,
  sendPasswordResetOtp, verifyPasswordResetOtp, resetPasswordWithPhone,
} = require('../controllers/auth.controller');
const { optionalAuth } = require('../middleware/auth.middleware');
const { passport, googleOAuthConfigured } = require('../config/passport');
const { googleLoginSuccess } = require('../controllers/auth.controller');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', optionalAuth, me);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/forgot-password/send-otp', sendPasswordResetOtp);
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp);
router.post('/reset-password/phone', resetPasswordWithPhone);
router.get('/google', (req, res, next) => {
  if (!googleOAuthConfigured) {
    const loginUrl = new URL('/login', process.env.CLIENT_URL || 'http://localhost:5173');
    loginUrl.searchParams.set('googleError', 'not_configured');
    return res.redirect(loginUrl.toString());
  }
  return passport.authenticate('google', { scope: ['profile', 'email'], state: true })(req, res, next);
});
router.get('/google/callback', (req, res, next) => {
  if (!googleOAuthConfigured) {
    const loginUrl = new URL('/login', process.env.CLIENT_URL || 'http://localhost:5173');
    loginUrl.searchParams.set('googleError', 'not_configured');
    return res.redirect(loginUrl.toString());
  }
  return passport.authenticate('google', {
    session: false,
    state: true,
    failureRedirect: `${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}/login?googleError=1`,
  })(req, res, next);
}, googleLoginSuccess);
module.exports = router;
