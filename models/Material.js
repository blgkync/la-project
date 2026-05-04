const { getDB } = require('../db/database');

class Material {
  static findAll(filters = {}) {
    const db = getDB();
    let sql = 'SELECT m.*, p.name as project_name, p.code as project_code, p.color as project_color FROM materials m LEFT JOIN projects p ON m.project_id = p.id WHERE 1=1';
    const params = [];

    if (filters.project_id) { sql += ' AND m.project_id = ?'; params.push(filters.project_id); }
    if (filters.search) { sql += ' AND (m.name LIKE ? OR m.supplier LIKE ?)'; const s = `%${filters.search}%`; params.push(s, s); }
    if (filters.low_stock) { sql += ' AND m.quantity <= m.min_threshold'; }

    sql += ' ORDER BY m.name ASC';
    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return getDB().prepare('SELECT * FROM materials WHERE id = ?').get(id);
  }

  static create(data) {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO materials (project_id, name, quantity, unit, min_threshold, supplier, location, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.project_id || null,
      data.name, data.quantity || 0, data.unit || 'adet',
      data.min_threshold || 0, data.supplier || null,
      data.location || null, data.notes || null
    );
    return this.findById(result.lastInsertRowid);
  }

  static update(id, data) {
    const db = getDB();
    const fields = [];
    const params = [];

    const allowed = ['project_id', 'name', 'quantity', 'unit', 'min_threshold', 'supplier', 'location', 'notes'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }

    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now','localtime')");
    params.push(id);

    db.prepare(`UPDATE materials SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  static delete(id) {
    return getDB().prepare('DELETE FROM materials WHERE id = ?').run(id);
  }

  static getLowStock(projectId) {
    const db = getDB();
    let sql = 'SELECT * FROM materials WHERE quantity <= min_threshold';
    const params = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    sql += ' ORDER BY name';
    return db.prepare(sql).all(...params);
  }

  static getTotalCount(projectId) {
    const db = getDB();
    let sql = 'SELECT COUNT(*) as c FROM materials';
    const params = [];
    if (projectId) { sql += ' WHERE project_id = ?'; params.push(projectId); }
    const r = db.prepare(sql).get(...params);
    return r.c;
  }
}

module.exports = Material;
