const router = require('express').Router();
const WorkPackage = require('../../models/WorkPackage');
const { filterByProject } = require('../../middleware/auth');

router.get('/', (req, res, next) => {
  try {
    let data = WorkPackage.findAll(req.query);
    data = filterByProject(data, req.projectScope);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

router.get('/summary', (req, res, next) => {
  try {
    const projectId = req.query.project_id;
    const totalBudget = WorkPackage.getTotalBudget(projectId);
    const overallProgress = WorkPackage.getOverallProgress(projectId);
    let all = WorkPackage.findAll(projectId ? { project_id: projectId } : {});
    all = filterByProject(all, req.projectScope);
    res.json({ success: true, data: { totalBudget, overallProgress, count: all.length } });
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    const data = WorkPackage.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Is paketi bulunamadi' });
    if (req.projectScope && data.project_id && !req.projectScope.includes(data.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu is paketine erisim yetkiniz yok' });
    }
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    if (!req.body.number || !req.body.title) return res.status(400).json({ success: false, message: 'Numara ve baslik zorunludur' });
    if (req.projectScope && req.body.project_id && !req.projectScope.includes(parseInt(req.body.project_id))) {
      return res.status(403).json({ success: false, message: 'Bu projeye erisim yetkiniz yok' });
    }
    const data = WorkPackage.create(req.body);
    res.status(201).json({ success: true, data, message: 'Is paketi olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = WorkPackage.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Is paketi bulunamadi' });
    if (req.projectScope && existing.project_id && !req.projectScope.includes(existing.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu is paketine erisim yetkiniz yok' });
    }
    const data = WorkPackage.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Is paketi guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = WorkPackage.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Is paketi bulunamadi' });
    if (req.projectScope && existing.project_id && !req.projectScope.includes(existing.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu is paketine erisim yetkiniz yok' });
    }
    WorkPackage.delete(req.params.id);
    res.json({ success: true, message: 'Is paketi silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
