const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('layout', { title: 'Ajanda', page: 'calendar', currentPath: '/calendar' });
});

module.exports = router;
