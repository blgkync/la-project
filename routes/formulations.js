const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('layout', { title: 'Formulasyonlar', page: 'formulations', currentPath: '/formulations' });
});

router.get('/compare', (req, res) => {
  res.render('layout', { title: 'Formulasyon Karsilastirma', page: 'formulation-compare', currentPath: '/formulations' });
});

module.exports = router;
