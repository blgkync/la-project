const router = require('express').Router();
const upload = require('../../middleware/upload');
const Attachment = require('../../models/Attachment');

// Upload file(s)
router.post('/upload', upload.array('files', 10), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Dosya secilmedi' });
    }
    if (!req.body.entity_type || !req.body.entity_id) {
      return res.status(400).json({ success: false, message: 'entity_type ve entity_id zorunludur' });
    }

    const attachments = req.files.map(file => {
      return Attachment.create({
        filename: file.filename,
        original_name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        entity_type: req.body.entity_type,
        entity_id: parseInt(req.body.entity_id),
        description: req.body.description || null,
        uploaded_by: req.body.uploaded_by || null
      });
    });

    res.status(201).json({
      success: true,
      data: attachments,
      message: `${attachments.length} dosya yuklendi`
    });
  } catch (e) { next(e); }
});

// List attachments for an entity
router.get('/:entityType/:entityId', (req, res, next) => {
  try {
    const data = Attachment.findByEntity(req.params.entityType, parseInt(req.params.entityId));
    const images = data.filter(a => a.mimetype.startsWith('image/'));
    const files = data.filter(a => !a.mimetype.startsWith('image/'));
    res.json({ success: true, data: { all: data, images, files }, count: data.length });
  } catch (e) { next(e); }
});

// Delete an attachment
router.delete('/:id', (req, res, next) => {
  try {
    const existing = Attachment.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Dosya bulunamadi' });
    Attachment.delete(req.params.id);
    res.json({ success: true, message: 'Dosya silindi' });
  } catch (e) { next(e); }
});

module.exports = router;
