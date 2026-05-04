const router = require('express').Router();
const CalendarEvent = require('../../models/CalendarEvent');
const { filterByProject } = require('../../middleware/auth');

router.get('/', (req, res, next) => {
  try {
    let data = CalendarEvent.findAll(req.query);
    data = filterByProject(data, req.projectScope);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

router.get('/today', (req, res, next) => {
  try {
    let data = CalendarEvent.getToday();
    data = filterByProject(data, req.projectScope);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/upcoming', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    let data = CalendarEvent.getUpcoming(limit * 3);
    data = filterByProject(data, req.projectScope);
    res.json({ success: true, data: data.slice(0, limit) });
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    const data = CalendarEvent.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Etkinlik bulunamadi' });
    if (req.projectScope && data.project_id && !req.projectScope.includes(data.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu etkinlige erisim yetkiniz yok' });
    }
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    if (!req.body.title) return res.status(400).json({ success: false, message: 'Baslik zorunludur' });
    if (!req.body.start_datetime) return res.status(400).json({ success: false, message: 'Baslangic tarihi zorunludur' });
    if (req.projectScope && req.body.project_id && !req.projectScope.includes(parseInt(req.body.project_id))) {
      return res.status(403).json({ success: false, message: 'Bu projeye erisim yetkiniz yok' });
    }
    const data = CalendarEvent.create(req.body);
    res.status(201).json({ success: true, data, message: 'Etkinlik olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = CalendarEvent.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Etkinlik bulunamadi' });
    if (req.projectScope && existing.project_id && !req.projectScope.includes(existing.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu etkinlige erisim yetkiniz yok' });
    }
    const data = CalendarEvent.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Etkinlik guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = CalendarEvent.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Etkinlik bulunamadi' });
    if (req.projectScope && existing.project_id && !req.projectScope.includes(existing.project_id)) {
      return res.status(403).json({ success: false, message: 'Bu etkinlige erisim yetkiniz yok' });
    }
    CalendarEvent.delete(req.params.id);
    res.json({ success: true, message: 'Etkinlik silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
