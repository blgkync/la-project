const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, (req, res) => {
  res.render('layout', { title: 'Yonetim Paneli', page: 'admin', currentPath: '/admin', user: req.session.user });
});

module.exports = router;
