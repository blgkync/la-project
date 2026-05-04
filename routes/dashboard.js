const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('layout', { title: 'Gosterge Paneli', page: 'dashboard', currentPath: '/' });
});

module.exports = router;
