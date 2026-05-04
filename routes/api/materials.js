const router = require('express').Router();
const Material = require('../../models/Material');
const { filterByProject } = require('../../middleware/auth');

router.get('/', (req, res, next) => {
  try {
    let data = Material.findAll(req.query);
    data = filterByProject(data, req.projectScope);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

router.get('/low-stock', (req, res, next) => {
  try {
    let data = Material.getLowStock();
    data = filterByProject(data, req.projectScope);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    const data = Material.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Malzeme bulunamadi' });
    if (req.projectScope && data.project_id && !req.projectScope.includes(data.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu malzemeye erisim yetkiniz yok' });
    }
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    if (!req.body.name) return res.status(400).json({ success: false, message: 'Ad zorunludur' });
    if (req.projectScope && req.body.project_id && !req.projectScope.includes(parseInt(req.body.project_id))) {
      return res.status(403).json({ success: false, message: 'Bu projeye erisim yetkiniz yok' });
    }
    const data = Material.create(req.body);
    res.status(201).json({ success: true, data, message: 'Malzeme olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = Material.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Malzeme bulunamadi' });
    if (req.projectScope && existing.project_id && !req.projectScope.includes(existing.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu malzemeye erisim yetkiniz yok' });
    }
    const data = Material.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Malzeme guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = Material.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Malzeme bulunamadi' });
    if (req.projectScope && existing.project_id && !req.projectScope.includes(existing.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu malzemeye erisim yetkiniz yok' });
    }
    Material.delete(req.params.id);
    res.json({ success: true, message: 'Malzeme silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
