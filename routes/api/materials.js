const router = require('express').Router();
const Material = require('../../models/Material');

router.get('/', (req, res, next) => {
  try {
    const data = Material.findAll(req.query);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

router.get('/low-stock', (req, res, next) => {
  try {
    const data = Material.getLowStock();
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    const data = Material.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Malzeme bulunamadi' });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    if (!req.body.name) return res.status(400).json({ success: false, message: 'Ad zorunludur' });
    const data = Material.create(req.body);
    res.status(201).json({ success: true, data, message: 'Malzeme olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = Material.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Malzeme bulunamadi' });
    const data = Material.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Malzeme guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = Material.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Malzeme bulunamadi' });
    Material.delete(req.params.id);
    res.json({ success: true, message: 'Malzeme silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
