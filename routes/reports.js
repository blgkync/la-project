const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('layout', { title: 'Raporlar', page: 'reports', currentPath: '/reports' });
});

module.exports = router;
