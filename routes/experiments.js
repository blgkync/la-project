const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('layout', { title: 'Deneyler', page: 'experiments', currentPath: '/experiments' });
});

router.get('/:id', (req, res) => {
  res.render('layout', { title: 'Deney Detayi', page: 'experiment-detail', currentPath: '/experiments', experimentId: req.params.id });
});

module.exports = router;
