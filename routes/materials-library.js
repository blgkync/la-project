const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('layout', { title: 'Malzeme Kutuphanesi', page: 'materials-library', currentPath: '/materials-library' });
});

module.exports = router;
