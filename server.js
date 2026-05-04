require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const session = require('express-session');

const { initDB } = require('./db/database');
const { requireAuth, injectProjectScope } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Session ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'la-project-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' }
}));

// --- View Engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Initialize Database ---
initDB();

// --- Auth Routes (public) ---
app.use('/', require('./routes/auth'));

// --- Protected Routes ---
app.use(requireAuth);

// --- Pass user to all views ---
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// --- Inject project scope for filtering ---
app.use(injectProjectScope);

// --- Routes ---
app.use('/', require('./routes/dashboard'));
app.use('/projects', require('./routes/projects'));
app.use('/experiments', require('./routes/experiments'));
app.use('/calendar', require('./routes/calendar'));
app.use('/workpackages', require('./routes/workpackages'));
app.use('/notebook', require('./routes/notebook'));
app.use('/equipment', require('./routes/equipment'));
app.use('/reports', require('./routes/reports'));
app.use('/formulations', require('./routes/formulations'));
app.use('/materials-library', require('./routes/materials-library'));
app.use('/admin', require('./routes/admin'));

// --- API Routes ---
app.use('/api/v1/projects', require('./routes/api/projects'));
app.use('/api/v1/experiments', require('./routes/api/experiments'));
app.use('/api/v1/calendar', require('./routes/api/calendar'));
app.use('/api/v1/workpackages', require('./routes/api/workpackages'));
app.use('/api/v1/notebook', require('./routes/api/notebook'));
app.use('/api/v1/equipment', require('./routes/api/equipment'));
app.use('/api/v1/materials', require('./routes/api/materials'));
app.use('/api/v1/dashboard', require('./routes/api/dashboard'));
app.use('/api/v1/reports', require('./routes/api/reports'));
app.use('/api/v1/attachments', require('./routes/api/attachments'));
app.use('/api/v1/materials-library', require('./routes/api/materials-library'));
app.use('/api/v1/formulations', require('./routes/api/formulations'));
app.use('/api/v1/comparisons', require('./routes/api/comparisons'));
app.use('/api/v1/users', require('./routes/api/users'));

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).render('layout', {
    title: '404 - Sayfa Bulunamadi',
    page: 'partials/404',
    currentPath: req.path,
    user: req.session ? req.session.user : null
  });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  const statusCode = err.statusCode || 500;
  if (req.path.startsWith('/api/')) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Sunucu hatasi',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  res.status(statusCode).render('layout', {
    title: 'Hata',
    page: 'partials/error',
    currentPath: req.path,
    error: { statusCode, message: err.message },
    user: req.session ? req.session.user : null
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n  LA Project - ArGe Lab Yonetim Sistemi`);
  console.log(`  Sunucu calisiyor: http://localhost:${PORT}`);
  console.log(`  Ortam: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
