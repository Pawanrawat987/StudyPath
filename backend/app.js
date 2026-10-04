const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const { passport, googleOAuthConfigured } = require('./config/passport');
const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const quizRoutes = require('./routes/quiz.routes');
const performanceRoutes = require('./routes/performance.routes');
const revisionRoutes = require('./routes/revision.routes');
const examRoutes = require('./routes/exam.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
if (googleOAuthConfigured) {
  app.use(session({
    name: 'studypath.oauth',
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
    },
  }));
}
app.use(passport.initialize());
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'StudyPath API is running' }));
app.use('/api/auth', authRoutes);
app.use('/api', contentRoutes);
app.use('/api', quizRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/revision', revisionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);

// In the Railway single-service deployment, Express also serves the built SPA.
// During local development Vite handles the frontend separately.
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(frontendDistPath, 'index.html'), (error) => error && next(error));
  });
}

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error?.name || 'UnknownError');
  if (error instanceof SyntaxError && error.status === 400 && Object.hasOwn(error, 'body')) {
    return res.status(400).json({ success: false, message: 'Invalid JSON request body.' });
  }
  if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
