const { getDB } = require('../db/database');

class WorkPackage {
  static findAll(filters = {}) {
    const db = getDB();
    let sql = 'SELECT wp.*, p.name as project_name, p.code as project_code, p.color as project_color FROM work_packages wp LEFT JOIN projects p ON wp.project_id = p.id WHERE 1=1';
    const params = [];

    if (filters.project_id) { sql += ' AND wp.project_id = ?'; params.push(filters.project_id); }
    if (filters.status) { sql += ' AND wp.status = ?'; params.push(filters.status); }
    sql += ' ORDER BY wp.project_id, wp.number ASC';
    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return getDB().prepare('SELECT wp.*, p.name as project_name, p.code as project_code, p.color as project_color FROM work_packages wp LEFT JOIN projects p ON wp.project_id = p.id WHERE wp.id = ?').get(id);
  }

  static findByNumber(number) {
    return getDB().prepare('SELECT * FROM work_packages WHERE number = ?').get(number);
  }

  static create(data) {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO work_packages (project_id, number, title, description, start_date, end_date, deliverables, progress, budget, status, dependencies, milestones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.project_id || null,
      data.number, data.title, data.description || null,
      data.start_date || null, data.end_date || null,
      JSON.stringify(data.deliverables || []), data.progress || 0,
      data.budget || 0, data.status || 'planned',
      JSON.stringify(data.dependencies || []),
      JSON.stringify(data.milestones || [])
    );
    return this.findById(result.lastInsertRowid);
  }

  static update(id, data) {
    const db = getDB();
    const fields = [];
    const params = [];

    const allowed = ['project_id', 'number', 'title', 'description', 'start_date', 'end_date', 'progress', 'budget', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }
    if (data.deliverables !== undefined) { fields.push('deliverables = ?'); params.push(JSON.stringify(data.deliverables)); }
    if (data.dependencies !== undefined) { fields.push('dependencies = ?'); params.push(JSON.stringify(data.dependencies)); }
    if (data.milestones !== undefined) { fields.push('milestones = ?'); params.push(JSON.stringify(data.milestones)); }

    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now','localtime')");
    params.push(id);

    db.prepare(`UPDATE work_packages SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  static delete(id) {
    return getDB().prepare('DELETE FROM work_packages WHERE id = ?').run(id);
  }

  static getTotalBudget(projectId) {
    const db = getDB();
    let sql = 'SELECT SUM(budget) as total FROM work_packages';
    const params = [];
    if (projectId) { sql += ' WHERE project_id = ?'; params.push(projectId); }
    const r = db.prepare(sql).get(...params);
    return r.total || 0;
  }

  static getOverallProgress(projectId) {
    const db = getDB();
    let sql = 'SELECT AVG(progress) as avg FROM work_packages';
    const params = [];
    if (projectId) { sql += ' WHERE project_id = ?'; params.push(projectId); }
    const r = db.prepare(sql).get(...params);
    return Math.round(r.avg || 0);
  }
}

module.exports = WorkPackage;
