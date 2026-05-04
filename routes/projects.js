const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('layout', { title: 'Projeler', page: 'projects', currentPath: '/projects' });
});

router.get('/:id', (req, res) => {
  res.render('layout', { title: 'Proje Detayi', page: 'project-detail', currentPath: '/projects', projectId: req.params.id });
});

module.exports = router;
