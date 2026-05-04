const { getDB } = require('../db/database');
const fs = require('fs');
const path = require('path');

class Attachment {
  static findByEntity(entityType, entityId) {
    return getDB().prepare(
      'SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC'
    ).all(entityType, entityId);
  }

  static findById(id) {
    return getDB().prepare('SELECT * FROM attachments WHERE id = ?').get(id);
  }

  static create(data) {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO attachments (filename, original_name, mimetype, size, entity_type, entity_id, description, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.filename, data.original_name, data.mimetype, data.size,
      data.entity_type, data.entity_id,
      data.description || null, data.uploaded_by || null
    );
    return this.findById(result.lastInsertRowid);
  }

  static delete(id) {
    const attachment = this.findById(id);
    if (attachment) {
      // Delete file from disk
      const filePath = path.join(__dirname, '..', 'uploads', attachment.entity_type + 's', attachment.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // Also try without the 's' suffix for entity types like 'lab_entry' -> 'notebook'
      const altMap = { experiment: 'experiments', lab_entry: 'notebook', project: 'projects', work_package: 'workpackages' };
      const altPath = path.join(__dirname, '..', 'uploads', altMap[attachment.entity_type] || (attachment.entity_type + 's'), attachment.filename);
      if (fs.existsSync(altPath)) {
        fs.unlinkSync(altPath);
      }
    }
    return getDB().prepare('DELETE FROM attachments WHERE id = ?').run(id);
  }

  static countByEntity(entityType, entityId) {
    const r = getDB().prepare('SELECT COUNT(*) as c FROM attachments WHERE entity_type = ? AND entity_id = ?').get(entityType, entityId);
    return r.c;
  }

  static getImages(entityType, entityId) {
    return getDB().prepare(
      "SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ? AND mimetype LIKE 'image/%' ORDER BY created_at DESC"
    ).all(entityType, entityId);
  }

  static getFiles(entityType, entityId) {
    return getDB().prepare(
      "SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ? AND mimetype NOT LIKE 'image/%' ORDER BY created_at DESC"
    ).all(entityType, entityId);
  }
}

module.exports = Attachment;
