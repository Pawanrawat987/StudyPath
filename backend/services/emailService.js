const nodemailer = require('nodemailer');

function createTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD || !process.env.EMAIL_FROM) {
    throw new Error('SMTP email configuration is incomplete');
  }

  const port = Number(EMAIL_PORT);
  // Google displays App Passwords in groups; SMTP authentication expects the
  // same passcode without display spaces.
  const smtpPassword = EMAIL_HOST === 'smtp.gmail.com' ? EMAIL_PASSWORD.replace(/\s/g, '') : EMAIL_PASSWORD;
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port,
    secure: port === 465,
    auth: { user: EMAIL_USER, pass: smtpPassword },
  });
}

async function sendVerificationEmail({ to, name, verificationUrl }) {
  const transporter = createTransporter();
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Verify your StudyPath email',
    text: `Hi ${name},\n\nVerify your email address by opening this link (valid for 24 hours):\n${verificationUrl}\n\nIf you did not create a StudyPath account, you can ignore this email.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p>Verify your StudyPath email address using the link below. It is valid for 24 hours.</p><p><a href="${escapeHtml(verificationUrl)}">Verify email</a></p><p>If you did not create a StudyPath account, you can ignore this email.</p>`,
  });
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const transporter = createTransporter();
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Reset your StudyPath password',
    text: `Hi ${name},\n\nReset your StudyPath password using this link (valid for 20 minutes):\n${resetUrl}\n\nIf you did not request a password reset, you can ignore this email.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p>Reset your StudyPath password using the link below. It is valid for 20 minutes.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>If you did not request a password reset, you can ignore this email.</p>`,
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
