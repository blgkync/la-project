const { getDB } = require('../db/database');

class CalendarEvent {
  static findAll(filters = {}) {
    const db = getDB();
    let sql = 'SELECT ce.*, p.name as project_name, p.code as project_code, p.color as project_color FROM calendar_events ce LEFT JOIN projects p ON ce.project_id = p.id WHERE 1=1';
    const params = [];

    if (filters.project_id) { sql += ' AND ce.project_id = ?'; params.push(filters.project_id); }
    if (filters.event_type) { sql += ' AND ce.event_type = ?'; params.push(filters.event_type); }
    if (filters.start) { sql += ' AND ce.start_datetime >= ?'; params.push(filters.start); }
    if (filters.end) { sql += ' AND ce.start_datetime <= ?'; params.push(filters.end); }
    if (filters.month && filters.year) {
      const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
      const nextMonth = filters.month == 12 ? `${parseInt(filters.year) + 1}-01-01` : `${filters.year}-${String(parseInt(filters.month) + 1).padStart(2, '0')}-01`;
      sql += ' AND ce.start_datetime >= ? AND ce.start_datetime < ?';
      params.push(start, nextMonth);
    }

    sql += ' ORDER BY ce.start_datetime ASC';
    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return getDB().prepare('SELECT * FROM calendar_events WHERE id = ?').get(id);
  }

  static create(data) {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO calendar_events (project_id, title, description, event_type, start_datetime, end_datetime, all_day, color, related_experiment_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const typeColors = { experiment: '#3b82f6', meeting: '#8b5cf6', deadline: '#ef4444', maintenance: '#f97316', review: '#22c55e' };
    const color = data.color || typeColors[data.event_type] || '#3b82f6';

    const result = stmt.run(
      data.project_id || null,
      data.title, data.description || null, data.event_type || 'experiment',
      data.start_datetime, data.end_datetime || data.start_datetime,
      data.all_day ? 1 : 0, color, data.related_experiment_id || null
    );
    return this.findById(result.lastInsertRowid);
  }

  static update(id, data) {
    const db = getDB();
    const fields = [];
    const params = [];

    const allowed = ['project_id', 'title', 'description', 'event_type', 'start_datetime', 'end_datetime', 'all_day', 'color', 'related_experiment_id'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'all_day' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now','localtime')");
    params.push(id);

    db.prepare(`UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  static delete(id) {
    return getDB().prepare('DELETE FROM calendar_events WHERE id = ?').run(id);
  }

  static getUpcoming(limit = 5, projectId) {
    const db = getDB();
    let sql = "SELECT * FROM calendar_events WHERE start_datetime >= datetime('now','localtime')";
    const params = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    sql += ' ORDER BY start_datetime ASC LIMIT ?';
    params.push(limit);
    return db.prepare(sql).all(...params);
  }

  static getToday(projectId) {
    const db = getDB();
    let sql = "SELECT * FROM calendar_events WHERE date(start_datetime) = date('now','localtime')";
    const params = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    sql += ' ORDER BY start_datetime ASC';
    return db.prepare(sql).all(...params);
  }
}

module.exports = CalendarEvent;
