const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, PasswordResetOtp } = require('../models');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { sendSms, assertSmsConfigured, SmsConfigurationError } = require('../services/smsService');

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 20 * 60 * 1000;
const EMAIL_RESET_RESEND_MS = 60 * 1000;
const PHONE_OTP_TTL_MS = 5 * 60 * 1000;
const PHONE_OTP_RESEND_MS = 60 * 1000;
const PHONE_OTP_MAX_ATTEMPTS = 5;
const PHONE_RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const GENERIC_RESET_MESSAGE = 'If an account exists for this email, a password reset link has been sent.';
const GENERIC_PHONE_RESET_MESSAGE = 'If an account exists with this phone number, an OTP has been sent.';

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashOtp(otp) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(otp).digest('hex');
}

function normalizePhoneNumber(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/[\s()-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
}

function logEmailFailure(label, error) {
  // Log only diagnostic fields; SMTP errors can contain provider response text.
  console.error(`${label} (code=${error?.code || 'unknown'}, command=${error?.command || 'unknown'}, responseCode=${error?.responseCode || 'unknown'})`);
}

function frontendUrl(path, token) {
  const baseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${baseUrl}${path}?token=${encodeURIComponent(token)}`;
}

function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validPassword(password) {
  return typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phoneNumber: user.phoneNumber || null,
  phoneVerified: Boolean(user.phoneVerified),
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, cookieOptions());
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    const phoneInput = req.body?.phoneNumber;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    if (!validEmail(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    if (!validPassword(password)) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include a letter and a number' });
    const phoneNumber = phoneInput ? normalizePhoneNumber(phoneInput) : null;
    if (phoneInput && !phoneNumber) return res.status(400).json({ success: false, message: 'Enter a phone number in international format, such as +919876543210.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.unscoped().findOne({ where: { email: normalizedEmail } })) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }
    if (phoneNumber && await User.unscoped().findOne({ where: { phoneNumber } })) {
      return res.status(409).json({ success: false, message: 'An account with this phone number already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const rawToken = generateToken();
    const user = await User.create({
      // Public registration must never let callers grant themselves management access.
      name: name.trim(), email: normalizedEmail, phoneNumber, phoneVerified: false, password: passwordHash, role: 'student',
      emailVerified: false,
      emailVerificationToken: hashToken(rawToken),
      emailVerificationExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
    });
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl: frontendUrl('/verify-email', rawToken),
      });
    } catch (error) {
      logEmailFailure('Verification email delivery failed', error);
      return res.status(503).json({
        success: false,
        message: 'Your account was created, but the verification email could not be sent. Configure email delivery or resend it later.',
      });
    }
    setAuthCookie(res, user);
    return res.status(201).json({ success: true, user: publicUser(user) });
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const user = await User.scope('withPassword').findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    setAuthCookie(res, user);
    return res.json({ success: true, user: publicUser(user) });
  } catch (error) { next(error); }
}

function logout(_req, res) {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
}

function me(req, res) { return res.json({ success: true, user: req.user ? publicUser(req.user) : null }); }

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (typeof token !== 'string' || !token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }
    const user = await User.unscoped().findOne({
      where: {
        emailVerificationToken: hashToken(token),
        emailVerificationExpires: { [Op.gt]: new Date() },
      },
    });
    if (!user) return res.status(400).json({ success: false, message: 'This verification link is invalid or expired. Request a new one.' });
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    return res.json({ success: true, message: 'Email verified. You can now sign in.' });
  } catch (error) { next(error); }
}

async function resendVerification(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!validEmail(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    const user = await User.unscoped().findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user || user.emailVerified) {
      return res.json({ success: true, message: 'If the account needs verification, a new email will be sent.' });
    }

    const rawToken = generateToken();
    user.emailVerificationToken = hashToken(rawToken);
    user.emailVerificationExpires = new Date(Date.now() + VERIFICATION_TTL_MS);
    await user.save();
    try {
      await sendVerificationEmail({ to: user.email, name: user.name, verificationUrl: frontendUrl('/verify-email', rawToken) });
    } catch (error) {
      logEmailFailure('Verification email delivery failed', error);
      return res.status(503).json({ success: false, message: 'Email delivery is temporarily unavailable. Try again later.' });
    }
    return res.json({ success: true, message: 'If the account needs verification, a new email will be sent.' });
  } catch (error) { next(error); }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!validEmail(email)) return res.status(400).json({ success: false, message: GENERIC_RESET_MESSAGE });
    const user = await User.unscoped().findOne({ where: { email: email.trim().toLowerCase() } });
    if (user) {
      if (user.passwordResetRequestedAt && Date.now() - new Date(user.passwordResetRequestedAt).getTime() < EMAIL_RESET_RESEND_MS) {
        return res.json({ success: true, message: GENERIC_RESET_MESSAGE });
      }
      const rawToken = generateToken();
      user.passwordResetToken = hashToken(rawToken);
      user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
      user.passwordResetRequestedAt = new Date();
      await user.save();
      try {
        await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl: frontendUrl('/reset-password', rawToken) });
      } catch (error) {
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.passwordResetRequestedAt = null;
        await user.save();
        logEmailFailure('Password reset email delivery failed', error);
      }
    }
    return res.json({ success: true, message: GENERIC_RESET_MESSAGE });
  } catch (error) { next(error); }
}

async function sendPasswordResetOtp(req, res, next) {
  try {
    const phoneNumber = normalizePhoneNumber(req.body?.phoneNumber);
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'Enter a valid phone number in international format, such as +919876543210.' });
    try {
      assertSmsConfigured();
    } catch (error) {
      return res.status(503).json({ success: false, message: error.message });
    }

    const user = await User.unscoped().findOne({ where: { phoneNumber } });
    if (!user) return res.json({ success: true, message: GENERIC_PHONE_RESET_MESSAGE });

    const now = new Date();
    const recentOtp = await PasswordResetOtp.findOne({
      where: { userId: user.id, createdAt: { [Op.gt]: new Date(now.getTime() - PHONE_OTP_RESEND_MS) } },
      order: [['createdAt', 'DESC']],
    });
    if (recentOtp) return res.json({ success: true, message: GENERIC_PHONE_RESET_MESSAGE });

    await PasswordResetOtp.destroy({ where: { userId: user.id } });
    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const record = await PasswordResetOtp.create({
      userId: user.id,
      phoneNumber,
      otpHash: hashOtp(otp),
      expiresAt: new Date(now.getTime() + PHONE_OTP_TTL_MS),
      attempts: 0,
    });
    try {
      await sendSms({ to: phoneNumber, message: `Your StudyPath password reset code is ${otp}. It expires in 5 minutes.` });
    } catch (error) {
      await record.destroy();
      if (error instanceof SmsConfigurationError) {
        return res.status(503).json({ success: false, message: error.message });
      }
      console.error(`Password reset SMS delivery failed (code=${error?.code || 'unknown'}, status=${error?.status || 'unknown'})`);
      return res.status(503).json({ success: false, message: 'SMS delivery is temporarily unavailable. Try again later.' });
    }
    return res.json({ success: true, message: GENERIC_PHONE_RESET_MESSAGE });
  } catch (error) { next(error); }
}

async function verifyPasswordResetOtp(req, res, next) {
  try {
    const phoneNumber = normalizePhoneNumber(req.body?.phoneNumber);
    const otp = req.body?.otp;
    if (!phoneNumber || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Enter the phone number and 6-digit OTP.' });
    }
    const record = await PasswordResetOtp.findOne({
      where: {
        phoneNumber,
        verifiedAt: null,
        expiresAt: { [Op.gt]: new Date() },
        attempts: { [Op.lt]: PHONE_OTP_MAX_ATTEMPTS },
      },
      order: [['createdAt', 'DESC']],
    });
    if (!record) return res.status(400).json({ success: false, message: 'This OTP is invalid or expired. Request a new one.' });

    record.attempts += 1;
    const submittedHash = Buffer.from(hashOtp(otp), 'hex');
    const storedHash = Buffer.from(record.otpHash, 'hex');
    const matches = submittedHash.length === storedHash.length && crypto.timingSafeEqual(submittedHash, storedHash);
    if (!matches) {
      await record.save();
      return res.status(400).json({ success: false, message: 'This OTP is invalid or expired. Request a new one.' });
    }

    const resetToken = generateToken();
    record.verifiedAt = new Date();
    record.resetTokenHash = hashToken(resetToken);
    record.resetTokenExpiresAt = new Date(Date.now() + PHONE_RESET_TOKEN_TTL_MS);
    await record.save();
    await User.update({ phoneVerified: true }, { where: { id: record.userId, phoneNumber } });
    return res.json({ success: true, resetToken });
  } catch (error) { next(error); }
}

async function resetPasswordWithPhone(req, res, next) {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body || {};
    if (typeof resetToken !== 'string' || !resetToken) return res.status(400).json({ success: false, message: 'Phone reset authorization is required. Verify your OTP again.' });
    if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    if (!validPassword(newPassword)) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include a letter and a number' });

    const record = await PasswordResetOtp.findOne({
      where: { resetTokenHash: hashToken(resetToken), verifiedAt: { [Op.ne]: null }, resetTokenExpiresAt: { [Op.gt]: new Date() } },
    });
    if (!record) return res.status(400).json({ success: false, message: 'Phone reset authorization is invalid or expired. Verify your OTP again.' });

    const user = await User.unscoped().findByPk(record.userId);
    if (!user || user.phoneNumber !== record.phoneNumber) {
      await record.destroy();
      return res.status(400).json({ success: false, message: 'Phone reset authorization is invalid or expired. Verify your OTP again.' });
    }
    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetRequestedAt = null;
    await user.save();
    await PasswordResetOtp.destroy({ where: { userId: user.id } });
    return res.json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (error) { next(error); }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || !token) return res.status(400).json({ success: false, message: 'Reset token is required' });
    if (!validPassword(password)) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include a letter and a number' });
    const user = await User.unscoped().findOne({
      where: {
        passwordResetToken: hashToken(token),
        passwordResetExpires: { [Op.gt]: new Date() },
      },
    });
    if (!user) return res.status(400).json({ success: false, message: 'This password reset link is invalid or expired. Request a new one.' });
    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetRequestedAt = null;
    await user.save();
    await PasswordResetOtp.destroy({ where: { userId: user.id } });
    return res.json({ success: true, message: 'Password updated. You can now sign in with your new password.' });
  } catch (error) { next(error); }
}

function googleLoginSuccess(req, res) {
  setAuthCookie(res, req.user);
  res.clearCookie('studypath.oauth', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  const destination = ['teacher', 'admin'].includes(req.user.role) ? '/admin' : '/dashboard';
  return res.redirect(`${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}${destination}`);
}

module.exports = {
  register, login, logout, me, verifyEmail, resendVerification, forgotPassword, resetPassword,
  sendPasswordResetOtp, verifyPasswordResetOtp, resetPasswordWithPhone,
  googleLoginSuccess,
};
