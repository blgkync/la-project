const router = require('express').Router();
const Equipment = require('../../models/Equipment');
const { filterByProject } = require('../../middleware/auth');

router.get('/', (req, res, next) => {
  try {
    let data = Equipment.findAll(req.query);
    data = filterByProject(data, req.projectScope);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

router.get('/stats', (req, res, next) => {
  try {
    const byStatus = Equipment.countByStatus();
    const maintenanceDue = Equipment.getMaintenanceDue();
    res.json({ success: true, data: { byStatus, maintenanceDue } });
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    const data = Equipment.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Ekipman bulunamadi' });
    if (req.projectScope && data.project_id && !req.projectScope.includes(data.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu ekipmana erisim yetkiniz yok' });
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
    const data = Equipment.create(req.body);
    res.status(201).json({ success: true, data, message: 'Ekipman olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = Equipment.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Ekipman bulunamadi' });
    if (req.projectScope && existing.project_id && !req.projectScope.includes(existing.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu ekipmana erisim yetkiniz yok' });
    }
    const data = Equipment.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Ekipman guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = Equipment.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Ekipman bulunamadi' });
    if (req.projectScope && existing.project_id && !req.projectScope.includes(existing.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu ekipmana erisim yetkiniz yok' });
    }
    Equipment.delete(req.params.id);
    res.json({ success: true, message: 'Ekipman silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
