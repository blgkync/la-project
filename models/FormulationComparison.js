const { getDB } = require('../db/database');

class FormulationComparison {
  static findAll(filters = {}) {
    const db = getDB();
    let sql = `SELECT fc.*, p.name as project_name, p.code as project_code,
               (SELECT COUNT(*) FROM comparison_items WHERE comparison_id = fc.id) as formulation_count
               FROM formulation_comparisons fc
               LEFT JOIN projects p ON fc.project_id = p.id
               WHERE 1=1`;
    const params = [];

    if (filters.project_id) { sql += ' AND fc.project_id = ?'; params.push(filters.project_id); }

    sql += ' ORDER BY fc.created_at DESC';
    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    const db = getDB();
    const comparison = db.prepare(`
      SELECT fc.*, p.name as project_name, p.code as project_code
      FROM formulation_comparisons fc
      LEFT JOIN projects p ON fc.project_id = p.id
      WHERE fc.id = ?
    `).get(id);

    if (comparison) {
      // Get formulations with their items
      const formulations = db.prepare(`
        SELECT f.*, ci.sort_order as comp_sort_order,
               p.name as project_name, p.code as project_code, p.color as project_color,
               e.title as experiment_title
        FROM comparison_items ci
        JOIN formulations f ON ci.formulation_id = f.id
        LEFT JOIN projects p ON f.project_id = p.id
        LEFT JOIN experiments e ON f.experiment_id = e.id
        WHERE ci.comparison_id = ?
        ORDER BY ci.sort_order, ci.id
      `).all(id);

      // Attach items to each formulation
      for (const f of formulations) {
        f.items = db.prepare(
          'SELECT * FROM formulation_items WHERE formulation_id = ? ORDER BY sort_order, id'
        ).all(f.id);
      }

      comparison.formulations = formulations;
    }

    return comparison;
  }

  static create(data) {
    const db = getDB();
    const createTx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO formulation_comparisons (name, project_id, experiment_id, notes)
        VALUES (?, ?, ?, ?)
      `).run(
        data.name,
        data.project_id || null,
        data.experiment_id || null,
        data.notes || null
      );

      const compId = result.lastInsertRowid;

      if (data.formulation_ids && data.formulation_ids.length > 0) {
        const addStmt = db.prepare('INSERT INTO comparison_items (comparison_id, formulation_id, sort_order) VALUES (?, ?, ?)');
        data.formulation_ids.forEach((fId, idx) => {
          addStmt.run(compId, fId, idx);
        });
      }

      return compId;
    });

    const id = createTx();
    return this.findById(id);
  }

  static delete(id) {
    return getDB().prepare('DELETE FROM formulation_comparisons WHERE id = ?').run(id);
  }

  static addFormulation(comparisonId, formulationId) {
    const db = getDB();
    const existing = db.prepare('SELECT id FROM comparison_items WHERE comparison_id = ? AND formulation_id = ?').get(comparisonId, formulationId);
    if (existing) return null; // already exists

    const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM comparison_items WHERE comparison_id = ?').get(comparisonId);
    const order = (maxOrder.max_order || 0) + 1;

    db.prepare('INSERT INTO comparison_items (comparison_id, formulation_id, sort_order) VALUES (?, ?, ?)').run(comparisonId, formulationId, order);
    return this.findById(comparisonId);
  }

  static removeFormulation(comparisonId, formulationId) {
    getDB().prepare('DELETE FROM comparison_items WHERE comparison_id = ? AND formulation_id = ?').run(comparisonId, formulationId);
    return this.findById(comparisonId);
  }
}

module.exports = FormulationComparison;
