const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('layout', { title: 'Lab Gunlugu', page: 'notebook', currentPath: '/notebook' });
});

module.exports = router;
