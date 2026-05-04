const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('layout', { title: 'Ekipman & Malzeme', page: 'equipment', currentPath: '/equipment' });
});

module.exports = router;
