const router = require('express').Router();
const WorkPackage = require('../../models/WorkPackage');

router.get('/', (req, res, next) => {
  try {
    const data = WorkPackage.findAll(req.query);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

router.get('/summary', (req, res, next) => {
  try {
    const projectId = req.query.project_id;
    const totalBudget = WorkPackage.getTotalBudget(projectId);
    const overallProgress = WorkPackage.getOverallProgress(projectId);
    const all = WorkPackage.findAll(projectId ? { project_id: projectId } : {});
    res.json({ success: true, data: { totalBudget, overallProgress, count: all.length } });
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    const data = WorkPackage.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Is paketi bulunamadi' });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    if (!req.body.number || !req.body.title) return res.status(400).json({ success: false, message: 'Numara ve baslik zorunludur' });
    const data = WorkPackage.create(req.body);
    res.status(201).json({ success: true, data, message: 'Is paketi olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = WorkPackage.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Is paketi bulunamadi' });
    const data = WorkPackage.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Is paketi guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = WorkPackage.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Is paketi bulunamadi' });
    WorkPackage.delete(req.params.id);
    res.json({ success: true, message: 'Is paketi silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
