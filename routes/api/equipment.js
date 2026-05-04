const router = require('express').Router();
const Equipment = require('../../models/Equipment');

router.get('/', (req, res, next) => {
  try {
    const data = Equipment.findAll(req.query);
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
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    if (!req.body.name) return res.status(400).json({ success: false, message: 'Ad zorunludur' });
    const data = Equipment.create(req.body);
    res.status(201).json({ success: true, data, message: 'Ekipman olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = Equipment.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Ekipman bulunamadi' });
    const data = Equipment.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Ekipman guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = Equipment.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Ekipman bulunamadi' });
    Equipment.delete(req.params.id);
    res.json({ success: true, message: 'Ekipman silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
