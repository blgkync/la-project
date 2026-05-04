const router = require('express').Router();
const Experiment = require('../../models/Experiment');

router.get('/', (req, res, next) => {
  try {
    const data = Experiment.findAll(req.query);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

router.get('/stats', (req, res, next) => {
  try {
    const projectId = req.query.project_id;
    const byStatus = Experiment.countByStatus(projectId);
    const researchers = Experiment.getResearchers();
    res.json({ success: true, data: { byStatus, researchers } });
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    const data = Experiment.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Deney bulunamadi' });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    if (!req.body.title) return res.status(400).json({ success: false, message: 'Baslik zorunludur' });
    const data = Experiment.create(req.body);
    res.status(201).json({ success: true, data, message: 'Deney olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = Experiment.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Deney bulunamadi' });
    const data = Experiment.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Deney guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = Experiment.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Deney bulunamadi' });
    Experiment.delete(req.params.id);
    res.json({ success: true, message: 'Deney silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
