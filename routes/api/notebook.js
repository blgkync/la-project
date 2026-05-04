const router = require('express').Router();
const LabEntry = require('../../models/LabEntry');

router.get('/', (req, res, next) => {
  try {
    const data = LabEntry.findAll(req.query);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

router.get('/authors', (req, res, next) => {
  try {
    const data = LabEntry.getAuthors();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/recent', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const data = LabEntry.getRecent(limit);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    const data = LabEntry.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Kayit bulunamadi' });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    if (!req.body.author || !req.body.content) return res.status(400).json({ success: false, message: 'Yazar ve icerik zorunludur' });
    const data = LabEntry.create(req.body);
    res.status(201).json({ success: true, data, message: 'Kayit olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = LabEntry.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Kayit bulunamadi' });
    const data = LabEntry.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Kayit guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = LabEntry.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Kayit bulunamadi' });
    LabEntry.delete(req.params.id);
    res.json({ success: true, message: 'Kayit silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
