const router = require('express').Router();
const CalendarEvent = require('../../models/CalendarEvent');

router.get('/', (req, res, next) => {
  try {
    const data = CalendarEvent.findAll(req.query);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

router.get('/today', (req, res, next) => {
  try {
    const data = CalendarEvent.getToday();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/upcoming', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const data = CalendarEvent.getUpcoming(limit);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    const data = CalendarEvent.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Etkinlik bulunamadi' });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    if (!req.body.title) return res.status(400).json({ success: false, message: 'Baslik zorunludur' });
    if (!req.body.start_datetime) return res.status(400).json({ success: false, message: 'Baslangic tarihi zorunludur' });
    const data = CalendarEvent.create(req.body);
    res.status(201).json({ success: true, data, message: 'Etkinlik olusturuldu' });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = CalendarEvent.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Etkinlik bulunamadi' });
    const data = CalendarEvent.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Etkinlik guncellendi' });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = CalendarEvent.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Etkinlik bulunamadi' });
    CalendarEvent.delete(req.params.id);
    res.json({ success: true, message: 'Etkinlik silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
