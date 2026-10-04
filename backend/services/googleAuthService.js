const { User } = require('../models');

async function findOrCreateGoogleUser(profile) {
  const googleId = profile?.id;
  const email = profile?.emails?.find((entry) => entry.verified !== false)?.value?.trim().toLowerCase();
  const name = profile?.displayName?.trim();
  const emailVerified = profile?._json?.email_verified ?? profile?.emails?.find((entry) => entry.value?.toLowerCase() === email)?.verified;

  if (!googleId || !email || !name || emailVerified !== true) {
    throw new Error('Google did not provide a verified email address and profile');
  }

  const linkedUser = await User.unscoped().findOne({ where: { googleId } });
  if (linkedUser) return linkedUser;

  const existingUser = await User.unscoped().findOne({ where: { email } });
  if (existingUser) {
    if (existingUser.googleId && existingUser.googleId !== googleId) {
      throw new Error('This email is already linked to a different Google account');
    }
    existingUser.googleId = googleId;
    existingUser.emailVerified = true;
    existingUser.emailVerificationToken = null;
    existingUser.emailVerificationExpires = null;
    await existingUser.save();
    return existingUser;
  }

  try {
    return await User.create({
      name,
      email,
      password: null,
      role: 'student',
      googleId,
      authProvider: 'google',
      emailVerified: true,
    });
  } catch (error) {
    if (error.name !== 'SequelizeUniqueConstraintError') throw error;
    const racedUser = await User.unscoped().findOne({ where: { googleId } });
    if (racedUser) return racedUser;
    throw error;
  }
}

module.exports = { findOrCreateGoogleUser };
