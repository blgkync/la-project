const { getDB } = require('../db/database');

class Experiment {
  static findAll(filters = {}) {
    const db = getDB();
    let sql = 'SELECT e.*, p.name as project_name, p.code as project_code, p.color as project_color FROM experiments e LEFT JOIN projects p ON e.project_id = p.id WHERE 1=1';
    const params = [];

    if (filters.project_id) { sql += ' AND e.project_id = ?'; params.push(filters.project_id); }
    if (filters.status) { sql += ' AND e.status = ?'; params.push(filters.status); }
    if (filters.priority) { sql += ' AND e.priority = ?'; params.push(filters.priority); }
    if (filters.researcher) { sql += ' AND e.researcher = ?'; params.push(filters.researcher); }
    if (filters.search) { sql += ' AND (e.title LIKE ? OR e.hypothesis LIKE ? OR e.tags LIKE ?)'; const s = `%${filters.search}%`; params.push(s, s, s); }
    if (filters.start_date) { sql += ' AND e.start_date >= ?'; params.push(filters.start_date); }
    if (filters.end_date) { sql += ' AND e.end_date <= ?'; params.push(filters.end_date); }

    sql += ' ORDER BY e.updated_at DESC';
    if (filters.limit) { sql += ' LIMIT ?'; params.push(parseInt(filters.limit)); }
    if (filters.offset) { sql += ' OFFSET ?'; params.push(parseInt(filters.offset)); }

    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return getDB().prepare('SELECT e.*, p.name as project_name, p.code as project_code, p.color as project_color FROM experiments e LEFT JOIN projects p ON e.project_id = p.id WHERE e.id = ?').get(id);
  }

  static create(data) {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO experiments (project_id, title, hypothesis, methodology, parameters, status, priority, start_date, end_date, researcher, results, observations, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.project_id || null,
      data.title, data.hypothesis || null, data.methodology || null,
      JSON.stringify(data.parameters || []), data.status || 'planned',
      data.priority || 'medium', data.start_date || null, data.end_date || null,
      data.researcher || null, data.results || null, data.observations || null,
      JSON.stringify(data.tags || [])
    );
    return this.findById(result.lastInsertRowid);
  }

  static update(id, data) {
    const db = getDB();
    const fields = [];
    const params = [];

    const allowed = ['project_id', 'title', 'hypothesis', 'methodology', 'status', 'priority', 'start_date', 'end_date', 'researcher', 'results', 'observations'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }
    if (data.parameters !== undefined) { fields.push('parameters = ?'); params.push(JSON.stringify(data.parameters)); }
    if (data.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(data.tags)); }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = datetime('now','localtime')");
    params.push(id);

    db.prepare(`UPDATE experiments SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  static delete(id) {
    return getDB().prepare('DELETE FROM experiments WHERE id = ?').run(id);
  }

  static countByStatus(projectId) {
    const db = getDB();
    let sql = 'SELECT status, COUNT(*) as count FROM experiments';
    const params = [];
    if (projectId) { sql += ' WHERE project_id = ?'; params.push(projectId); }
    sql += ' GROUP BY status';
    return db.prepare(sql).all(...params);
  }

  static getResearchers() {
    return getDB().prepare('SELECT DISTINCT researcher FROM experiments WHERE researcher IS NOT NULL ORDER BY researcher').all().map(r => r.researcher);
  }
}

module.exports = Experiment;
