const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { findOrCreateGoogleUser } = require('../services/googleAuthService');

const googleOAuthConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL
);

if (googleOAuthConfigured && !passport._strategies.google) {
  passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    state: true,
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      done(null, await findOrCreateGoogleUser(profile));
    } catch (error) {
      done(error);
    }
  }));
}

module.exports = { passport, googleOAuthConfigured };
