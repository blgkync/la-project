const { getDB } = require('../db/database');

class LabEntry {
  static findAll(filters = {}) {
    const db = getDB();
    let sql = `SELECT le.*, e.title as experiment_title, p.name as project_name, p.code as project_code, p.color as project_color
               FROM lab_entries le
               LEFT JOIN experiments e ON le.related_experiment_id = e.id
               LEFT JOIN projects p ON le.project_id = p.id
               WHERE 1=1`;
    const params = [];

    if (filters.project_id) { sql += ' AND le.project_id = ?'; params.push(filters.project_id); }
    if (filters.category) { sql += ' AND le.category = ?'; params.push(filters.category); }
    if (filters.author) { sql += ' AND le.author = ?'; params.push(filters.author); }
    if (filters.search) { sql += ' AND (le.content LIKE ? OR le.author LIKE ?)'; const s = `%${filters.search}%`; params.push(s, s); }
    if (filters.experiment_id) { sql += ' AND le.related_experiment_id = ?'; params.push(filters.experiment_id); }
    if (filters.start_date) { sql += ' AND le.created_at >= ?'; params.push(filters.start_date); }
    if (filters.end_date) { sql += ' AND le.created_at <= ?'; params.push(filters.end_date); }

    sql += ' ORDER BY le.created_at DESC';
    if (filters.limit) { sql += ' LIMIT ?'; params.push(parseInt(filters.limit)); }
    if (filters.offset) { sql += ' OFFSET ?'; params.push(parseInt(filters.offset)); }

    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return getDB().prepare(`
      SELECT le.*, e.title as experiment_title, p.name as project_name, p.code as project_code, p.color as project_color
      FROM lab_entries le
      LEFT JOIN experiments e ON le.related_experiment_id = e.id
      LEFT JOIN projects p ON le.project_id = p.id
      WHERE le.id = ?
    `).get(id);
  }

  static create(data) {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO lab_entries (project_id, author, category, content, related_experiment_id, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.project_id || null,
      data.author, data.category || 'note', data.content,
      data.related_experiment_id || null,
      JSON.stringify(data.tags || [])
    );
    return this.findById(result.lastInsertRowid);
  }

  static update(id, data) {
    const db = getDB();
    const fields = [];
    const params = [];

    const allowed = ['project_id', 'author', 'category', 'content', 'related_experiment_id'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }
    if (data.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(data.tags)); }

    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now','localtime')");
    params.push(id);

    db.prepare(`UPDATE lab_entries SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  static delete(id) {
    return getDB().prepare('DELETE FROM lab_entries WHERE id = ?').run(id);
  }

  static getAuthors() {
    return getDB().prepare('SELECT DISTINCT author FROM lab_entries ORDER BY author').all().map(r => r.author);
  }

  static getRecent(limit = 5, projectId) {
    const db = getDB();
    let sql = `SELECT le.*, e.title as experiment_title
      FROM lab_entries le
      LEFT JOIN experiments e ON le.related_experiment_id = e.id
      WHERE 1=1`;
    const params = [];
    if (projectId) { sql += ' AND le.project_id = ?'; params.push(projectId); }
    sql += ' ORDER BY le.created_at DESC LIMIT ?';
    params.push(limit);
    return db.prepare(sql).all(...params);
  }
}

module.exports = LabEntry;
