function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    return next();
  }
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ success: false, message: 'Oturum acmaniz gerekiyor' });
  }
  res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  if (req.path.startsWith('/api/')) {
    return res.status(403).json({ success: false, message: 'Yetkiniz yok' });
  }
  res.status(403).render('layout', {
    title: 'Yetkisiz Erisim',
    page: 'partials/403',
    currentPath: req.path,
    user: req.session.user
  });
}

function readOnly(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ success: false, message: 'Sadece okuma yetkiniz var' });
    }
    return res.status(403).render('layout', {
      title: 'Yetkisiz Islem',
      page: 'partials/403',
      currentPath: req.path,
      user: req.session.user
    });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, readOnly };
