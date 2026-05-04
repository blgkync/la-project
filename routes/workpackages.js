const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('layout', { title: 'Is Paketleri', page: 'workpackages', currentPath: '/workpackages' });
});

module.exports = router;
