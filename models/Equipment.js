const { getDB } = require('../db/database');

class Equipment {
  static findAll(filters = {}) {
    const db = getDB();
    let sql = 'SELECT eq.*, p.name as project_name, p.code as project_code, p.color as project_color FROM equipment eq LEFT JOIN projects p ON eq.project_id = p.id WHERE 1=1';
    const params = [];

    if (filters.project_id) { sql += ' AND eq.project_id = ?'; params.push(filters.project_id); }
    if (filters.status) { sql += ' AND eq.status = ?'; params.push(filters.status); }
    if (filters.search) { sql += ' AND (eq.name LIKE ? OR eq.model LIKE ? OR eq.location LIKE ?)'; const s = `%${filters.search}%`; params.push(s, s, s); }

    sql += ' ORDER BY eq.name ASC';
    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return getDB().prepare('SELECT * FROM equipment WHERE id = ?').get(id);
  }

  static create(data) {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO equipment (project_id, name, model, serial_no, location, status, last_calibration, next_maintenance, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.project_id || null,
      data.name, data.model || null, data.serial_no || null,
      data.location || null, data.status || 'available',
      data.last_calibration || null, data.next_maintenance || null,
      data.notes || null
    );
    return this.findById(result.lastInsertRowid);
  }

  static update(id, data) {
    const db = getDB();
    const fields = [];
    const params = [];

    const allowed = ['project_id', 'name', 'model', 'serial_no', 'location', 'status', 'last_calibration', 'next_maintenance', 'notes'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }

    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now','localtime')");
    params.push(id);

    db.prepare(`UPDATE equipment SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  static delete(id) {
    return getDB().prepare('DELETE FROM equipment WHERE id = ?').run(id);
  }

  static countByStatus(projectId) {
    const db = getDB();
    let sql = 'SELECT status, COUNT(*) as count FROM equipment';
    const params = [];
    if (projectId) { sql += ' WHERE project_id = ?'; params.push(projectId); }
    sql += ' GROUP BY status';
    return db.prepare(sql).all(...params);
  }

  static getMaintenanceDue(projectId) {
    const db = getDB();
    let sql = "SELECT * FROM equipment WHERE next_maintenance <= date('now', '+7 days', 'localtime') AND status != 'out_of_order'";
    const params = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    sql += ' ORDER BY next_maintenance ASC';
    return db.prepare(sql).all(...params);
  }
}

module.exports = Equipment;
