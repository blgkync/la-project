const router = require('express').Router();
const MaterialLibrary = require('../../models/MaterialLibrary');

// GET all materials
router.get('/', (req, res, next) => {
  try {
    const data = MaterialLibrary.findAll(req.query);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

// GET search for autocomplete
router.get('/search', (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (q.length < 1) return res.json({ success: true, data: [] });
    const data = MaterialLibrary.search(q);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// GET categories
router.get('/categories', (req, res, next) => {
  try {
    const data = MaterialLibrary.getCategories();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// GET by id
router.get('/:id', (req, res, next) => {
  try {
    const data = MaterialLibrary.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Malzeme bulunamadi' });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// POST create
router.post('/', (req, res, next) => {
  try {
    if (!req.body.name) return res.status(400).json({ success: false, message: 'Malzeme adi zorunludur' });
    const data = MaterialLibrary.create(req.body);
    res.status(201).json({ success: true, data, message: 'Malzeme eklendi' });
  } catch (e) { next(e); }
});

// POST import bulk
router.post('/import', (req, res, next) => {
  try {
    const items = req.body.items;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Icerik bos veya gecersiz format' });
    }
    // Validate each item has a name
    for (const item of items) {
      if (!item.name || !item.name.trim()) {
        return res.status(400).json({ success: false, message: 'Tum malzemelerin adi olmalidir' });
      }
    }
    const ids = MaterialLibrary.importBulk(items);
    res.status(201).json({ success: true, data: { imported: ids.length }, message: `${ids.length} malzeme iceri aktarildi` });
  } catch (e) { next(e); }
});

// PUT update
router.put('/:id', (req, res, next) => {
  try {
    const existing = MaterialLibrary.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Malzeme bulunamadi' });
    const data = MaterialLibrary.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Malzeme guncellendi' });
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:id', (req, res, next) => {
  try {
    const existing = MaterialLibrary.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Malzeme bulunamadi' });
    MaterialLibrary.delete(req.params.id);
    res.json({ success: true, message: 'Malzeme silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
