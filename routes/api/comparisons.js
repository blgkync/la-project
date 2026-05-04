const router = require('express').Router();
const FormulationComparison = require('../../models/FormulationComparison');

// GET all
router.get('/', (req, res, next) => {
  try {
    const data = FormulationComparison.findAll(req.query);
    res.json({ success: true, data, count: data.length });
  } catch (e) { next(e); }
});

// GET by id
router.get('/:id', (req, res, next) => {
  try {
    const data = FormulationComparison.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Karsilastirma bulunamadi' });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// POST create
router.post('/', (req, res, next) => {
  try {
    if (!req.body.name) return res.status(400).json({ success: false, message: 'Ad zorunludur' });
    const data = FormulationComparison.create(req.body);
    res.status(201).json({ success: true, data, message: 'Karsilastirma olusturuldu' });
  } catch (e) { next(e); }
});

// POST add formulation
router.post('/:id/formulations', (req, res, next) => {
  try {
    const fId = req.body.formulation_id;
    if (!fId) return res.status(400).json({ success: false, message: 'Formulasyon ID zorunludur' });
    const data = FormulationComparison.addFormulation(req.params.id, fId);
    if (!data) return res.status(409).json({ success: false, message: 'Bu formulasyon zaten eklenmis' });
    res.json({ success: true, data, message: 'Formulasyon eklendi' });
  } catch (e) { next(e); }
});

// DELETE remove formulation
router.delete('/:id/formulations/:formulationId', (req, res, next) => {
  try {
    const data = FormulationComparison.removeFormulation(req.params.id, req.params.formulationId);
    res.json({ success: true, data, message: 'Formulasyon cikarildi' });
  } catch (e) { next(e); }
});

// DELETE comparison
router.delete('/:id', (req, res, next) => {
  try {
    const existing = FormulationComparison.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Karsilastirma bulunamadi' });
    FormulationComparison.delete(req.params.id);
    res.json({ success: true, message: 'Karsilastirma silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
