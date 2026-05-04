const ProjectAssignment = require('../models/ProjectAssignment');

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

function injectProjectScope(req, res, next) {
  const user = req.session.user;
  if (!user) return next();

  if (user.role === 'admin') {
    req.projectScope = null;
    res.locals.projectScope = null;
    return next();
  }

  const projectIds = ProjectAssignment.getProjectIds(user.id);
  req.projectScope = projectIds;
  res.locals.projectScope = projectIds;
  next();
}

function filterByProject(data, projectIds) {
  if (!projectIds) return data;
  return data.filter(item => {
    if (item.project_id === null || item.project_id === undefined) return false;
    return projectIds.includes(item.project_id);
  });
}

module.exports = { requireAuth, requireAdmin, injectProjectScope, filterByProject };
