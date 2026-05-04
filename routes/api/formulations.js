const router = require('express').Router();
const Formulation = require('../../models/Formulation');

// GET all formulations
router.get('/', (req, res, next) => {
  try {
    const data = Formulation.findAll(req.query);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

// GET next code
router.get('/next-code', (req, res, next) => {
  try {
    const code = Formulation.getNextCode();
    res.json({ success: true, data: { code } });
  } catch (e) { next(e); }
});

// GET stats
router.get('/stats', (req, res, next) => {
  try {
    const projectId = req.query.project_id;
    const byStatus = Formulation.countByStatus(projectId);
    res.json({ success: true, data: { byStatus } });
  } catch (e) { next(e); }
});

// GET by experiment
router.get('/by-experiment/:id', (req, res, next) => {
  try {
    const data = Formulation.getByExperiment(req.params.id);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

// GET by project
router.get('/by-project/:id', (req, res, next) => {
  try {
    const data = Formulation.getByProject(req.params.id);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

// GET by id
router.get('/:id', (req, res, next) => {
  try {
    const data = Formulation.findByIdWithItems(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Formulasyon bulunamadi' });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// POST create
router.post('/', (req, res, next) => {
  try {
    if (!req.body.name) return res.status(400).json({ success: false, message: 'Formulasyon adi zorunludur' });
    const data = Formulation.create(req.body);
    res.status(201).json({ success: true, data, message: 'Formulasyon olusturuldu' });
  } catch (e) { next(e); }
});

// POST clone
router.post('/:id/clone', (req, res, next) => {
  try {
    const existing = Formulation.findByIdWithItems(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Formulasyon bulunamadi' });
    const data = Formulation.clone(req.params.id, req.body.name, req.body.batch_size);
    res.status(201).json({ success: true, data, message: 'Formulasyon klonlandi' });
  } catch (e) { next(e); }
});

// PUT update
router.put('/:id', (req, res, next) => {
  try {
    const existing = Formulation.findByIdWithItems(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Formulasyon bulunamadi' });
    const data = Formulation.update(req.params.id, req.body);
    res.json({ success: true, data, message: 'Formulasyon guncellendi' });
  } catch (e) { next(e); }
});

// PUT batch size
router.put('/:id/batch-size', (req, res, next) => {
  try {
    const newSize = parseFloat(req.body.batch_size);
    if (!newSize || newSize <= 0) return res.status(400).json({ success: false, message: 'Gecersiz batch boyutu' });
    const existing = Formulation.findByIdWithItems(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Formulasyon bulunamadi' });
    const data = Formulation.updateBatchSize(req.params.id, newSize);
    res.json({ success: true, data, message: 'Batch boyutu guncellendi' });
  } catch (e) { next(e); }
});

// PUT recalculate
router.put('/:id/recalculate', (req, res, next) => {
  try {
    const existing = Formulation.findByIdWithItems(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Formulasyon bulunamadi' });
    const data = Formulation.recalculate(req.params.id);
    res.json({ success: true, data, message: 'Yeniden hesaplandi' });
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:id', (req, res, next) => {
  try {
    const existing = Formulation.findByIdWithItems(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Formulasyon bulunamadi' });
    Formulation.delete(req.params.id);
    res.json({ success: true, message: 'Formulasyon silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
