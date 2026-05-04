const router = require('express').Router();
const LabEntry = require('../../models/LabEntry');
const { filterByProject } = require('../../middleware/auth');

router.get('/', (req, res, next) => {
  try {
    let data = LabEntry.findAll(req.query);
    data = filterByProject(data, req.projectScope);
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
    let data = LabEntry.getRecent(limit * 3);
    data = filterByProject(data, req.projectScope);
    res.json({ success: true, data: data.slice(0, limit) });
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    const data = LabEntry.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Kayit bulunamadi' });
    if (req.projectScope && data.project_id && !req.projectScope.includes(data.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu kayda erisim yetkiniz yok' });
    }
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    if (!req.body.author || !req.body.content) return res.status(400).json({ success: false, message: 'Yazar ve icerik zorunludur' });
    if (req.projectScope && req.body.project_id && !req.projectScope.includes(parseInt(req.body.project_id))) {
      return res.status(403).json({ success: false, message: 'Bu projeye erisim yetkiniz yok' });
    }
    const data = LabEntry.create(req.body);
    res.status(201).json({ success: true, data, message: 'Kayit olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = LabEntry.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Kayit bulunamadi' });
    if (req.projectScope && existing.project_id && !req.projectScope.includes(existing.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu kayda erisim yetkiniz yok' });
    }
    const data = LabEntry.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Kayit guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = LabEntry.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Kayit bulunamadi' });
    if (req.projectScope && existing.project_id && !req.projectScope.includes(existing.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu kayda erisim yetkiniz yok' });
    }
    LabEntry.delete(req.params.id);
    res.json({ success: true, message: 'Kayit silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
