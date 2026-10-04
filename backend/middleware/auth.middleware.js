const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }

  try {
    const user = await User.findByPk(payload.sub);
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
    req.user = user;
    return next();
  } catch (error) { return next(error); }
}

async function optionalAuth(req, res, next) {
  if (!req.cookies?.token) {
    req.user = null;
    return next();
  }
  return requireAuth(req, res, next);
}

module.exports = { requireAuth, optionalAuth };
