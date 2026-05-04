const { getDB } = require('../db/database');

class Project {
  static findAll(filters = {}) {
    const db = getDB();
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    if (filters.status) { sql += ' AND status = ?'; params.push(filters.status); }
    if (filters.type) { sql += ' AND type = ?'; params.push(filters.type); }
    if (filters.search) { sql += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)'; const s = `%${filters.search}%`; params.push(s, s, s); }

    sql += ' ORDER BY created_at DESC';
    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return getDB().prepare('SELECT * FROM projects WHERE id = ?').get(id);
  }

  static findByCode(code) {
    return getDB().prepare('SELECT * FROM projects WHERE code = ?').get(code);
  }

  static create(data) {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO projects (name, code, type, description, status, start_date, end_date, budget, spent, pi_name, institution, program, tags, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.name, data.code, data.type || 'lab',
      data.description || null, data.status || 'active',
      data.start_date || null, data.end_date || null,
      data.budget || 0, data.spent || 0,
      data.pi_name || null, data.institution || null,
      data.program || null,
      JSON.stringify(data.tags || []),
      data.color || '#06b6d4'
    );
    return this.findById(result.lastInsertRowid);
  }

  static update(id, data) {
    const db = getDB();
    const fields = [];
    const params = [];

    const allowed = ['name', 'code', 'type', 'description', 'status', 'start_date', 'end_date', 'budget', 'spent', 'pi_name', 'institution', 'program', 'color'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }
    if (data.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(data.tags)); }

    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now','localtime')");
    params.push(id);

    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  static delete(id) {
    const db = getDB();
    // Set project_id to null for all related entities
    db.prepare('UPDATE experiments SET project_id = NULL WHERE project_id = ?').run(id);
    db.prepare('UPDATE work_packages SET project_id = NULL WHERE project_id = ?').run(id);
    db.prepare('UPDATE calendar_events SET project_id = NULL WHERE project_id = ?').run(id);
    db.prepare('UPDATE lab_entries SET project_id = NULL WHERE project_id = ?').run(id);
    db.prepare('UPDATE equipment SET project_id = NULL WHERE project_id = ?').run(id);
    db.prepare('UPDATE materials SET project_id = NULL WHERE project_id = ?').run(id);
    db.prepare('UPDATE tasks SET project_id = NULL WHERE project_id = ?').run(id);
    return db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  static getStats(projectId) {
    const db = getDB();
    const experiments = db.prepare('SELECT COUNT(*) as c FROM experiments WHERE project_id = ?').get(projectId).c;
    const activeExperiments = db.prepare("SELECT COUNT(*) as c FROM experiments WHERE project_id = ? AND status = 'in_progress'").get(projectId).c;
    const workPackages = db.prepare('SELECT COUNT(*) as c FROM work_packages WHERE project_id = ?').get(projectId).c;
    const wpProgress = db.prepare('SELECT AVG(progress) as avg FROM work_packages WHERE project_id = ?').get(projectId).avg || 0;
    const labEntries = db.prepare('SELECT COUNT(*) as c FROM lab_entries WHERE project_id = ?').get(projectId).c;
    const upcomingEvents = db.prepare("SELECT COUNT(*) as c FROM calendar_events WHERE project_id = ? AND start_datetime >= datetime('now','localtime')").get(projectId).c;

    return { experiments, activeExperiments, workPackages, wpProgress: Math.round(wpProgress), labEntries, upcomingEvents };
  }

  static countByType() {
    return getDB().prepare('SELECT type, COUNT(*) as count FROM projects GROUP BY type').all();
  }

  static countByStatus() {
    return getDB().prepare('SELECT status, COUNT(*) as count FROM projects GROUP BY status').all();
  }

  static getActiveProjects() {
    return getDB().prepare("SELECT id, name, code, color, type FROM projects WHERE status = 'active' OR status = 'on_hold' ORDER BY name").all();
  }
}

module.exports = Project;
