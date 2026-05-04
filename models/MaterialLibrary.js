const { getDB } = require('../db/database');

class MaterialLibrary {
  static findAll(filters = {}) {
    const db = getDB();
    let sql = 'SELECT * FROM materials_library WHERE 1=1';
    const params = [];

    if (filters.category) { sql += ' AND category = ?'; params.push(filters.category); }
    if (filters.is_active !== undefined) { sql += ' AND is_active = ?'; params.push(filters.is_active); }
    if (filters.search) {
      sql += ' AND (name LIKE ? OR supplier LIKE ? OR cas_number LIKE ? OR description LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY category, name';
    if (filters.limit) { sql += ' LIMIT ?'; params.push(parseInt(filters.limit)); }
    if (filters.offset) { sql += ' OFFSET ?'; params.push(parseInt(filters.offset)); }

    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    return getDB().prepare('SELECT * FROM materials_library WHERE id = ?').get(id);
  }

  static create(data) {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO materials_library (name, category, sub_category, unit, supplier, cas_number, description, density, cost_per_unit, is_active, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.name,
      data.category || 'toz',
      data.sub_category || null,
      data.unit || 'g',
      data.supplier || null,
      data.cas_number || null,
      data.description || null,
      data.density || null,
      data.cost_per_unit || null,
      data.is_active !== undefined ? data.is_active : 1,
      JSON.stringify(data.tags || [])
    );
    return this.findById(result.lastInsertRowid);
  }

  static update(id, data) {
    const db = getDB();
    const fields = [];
    const params = [];

    const allowed = ['name', 'category', 'sub_category', 'unit', 'supplier', 'cas_number', 'description', 'density', 'cost_per_unit', 'is_active'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }
    if (data.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(data.tags)); }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = datetime('now','localtime')");
    params.push(id);

    db.prepare(`UPDATE materials_library SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  static delete(id) {
    return getDB().prepare('DELETE FROM materials_library WHERE id = ?').run(id);
  }

  static getCategories() {
    return getDB().prepare('SELECT DISTINCT category FROM materials_library ORDER BY category').all().map(r => r.category);
  }

  static search(query) {
    const db = getDB();
    return db.prepare(`SELECT id, name, category, unit, supplier FROM materials_library WHERE is_active = 1 AND name LIKE ? ORDER BY name LIMIT 20`).all(`%${query}%`);
  }

  static importBulk(items) {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO materials_library (name, category, unit, supplier, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const insertMany = db.transaction((rows) => {
      const results = [];
      for (const row of rows) {
        const r = stmt.run(row.name, row.category || 'diger', row.unit || 'g', row.supplier || null);
        results.push(r.lastInsertRowid);
      }
      return results;
    });
    return insertMany(items);
  }

  static count(filters = {}) {
    const db = getDB();
    let sql = 'SELECT COUNT(*) as count FROM materials_library WHERE 1=1';
    const params = [];
    if (filters.category) { sql += ' AND category = ?'; params.push(filters.category); }
    if (filters.is_active !== undefined) { sql += ' AND is_active = ?'; params.push(filters.is_active); }
    return db.prepare(sql).get(...params).count;
  }
}

module.exports = MaterialLibrary;
