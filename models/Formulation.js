const { getDB } = require('../db/database');

class Formulation {
  static findAll(filters = {}) {
    const db = getDB();
    let sql = `SELECT f.*, p.name as project_name, p.code as project_code, p.color as project_color,
               e.title as experiment_title,
               (SELECT COUNT(*) FROM formulation_items WHERE formulation_id = f.id) as item_count,
               pf.name as parent_name, pf.code as parent_code
               FROM formulations f
               LEFT JOIN projects p ON f.project_id = p.id
               LEFT JOIN experiments e ON f.experiment_id = e.id
               LEFT JOIN formulations pf ON f.parent_id = pf.id
               WHERE 1=1`;
    const params = [];

    if (filters.project_id) { sql += ' AND f.project_id = ?'; params.push(filters.project_id); }
    if (filters.experiment_id) { sql += ' AND f.experiment_id = ?'; params.push(filters.experiment_id); }
    if (filters.status) { sql += ' AND f.status = ?'; params.push(filters.status); }
    if (filters.search) {
      sql += ' AND (f.name LIKE ? OR f.code LIKE ? OR f.description LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY f.updated_at DESC';
    if (filters.limit) { sql += ' LIMIT ?'; params.push(parseInt(filters.limit)); }
    if (filters.offset) { sql += ' OFFSET ?'; params.push(parseInt(filters.offset)); }

    return db.prepare(sql).all(...params);
  }

  static findById(id) {
    const db = getDB();
    const formulation = db.prepare(`
      SELECT f.*, p.name as project_name, p.code as project_code, p.color as project_color,
             e.title as experiment_title,
             pf.name as parent_name, pf.code as parent_code
      FROM formulations f
      LEFT JOIN projects p ON f.project_id = p.id
      LEFT JOIN experiments e ON f.experiment_id = e.id
      LEFT JOIN formulations pf ON f.parent_id = pf.id
      WHERE f.id = ?
    `).get(id);

    if (formulation) {
      formulation.items = db.prepare(`
        SELECT fi.*, ml.supplier as material_supplier
        FROM formulation_items fi
        LEFT JOIN materials_library ml ON fi.material_id = ml.id
        ORDER BY fi.sort_order, fi.id
      `.replace('ORDER', 'WHERE fi.formulation_id = ? ORDER')).all(id);
      // fix the query — cleaner approach
    }
    return formulation;
  }

  static findByIdWithItems(id) {
    const db = getDB();
    const formulation = db.prepare(`
      SELECT f.*, p.name as project_name, p.code as project_code, p.color as project_color,
             e.title as experiment_title,
             pf.name as parent_name, pf.code as parent_code
      FROM formulations f
      LEFT JOIN projects p ON f.project_id = p.id
      LEFT JOIN experiments e ON f.experiment_id = e.id
      LEFT JOIN formulations pf ON f.parent_id = pf.id
      WHERE f.id = ?
    `).get(id);

    if (formulation) {
      formulation.items = db.prepare(
        'SELECT fi.*, ml.supplier as material_supplier FROM formulation_items fi LEFT JOIN materials_library ml ON fi.material_id = ml.id WHERE fi.formulation_id = ? ORDER BY fi.sort_order, fi.id'
      ).all(id);
    }
    return formulation;
  }

  static create(data) {
    const db = getDB();

    const createTx = db.transaction(() => {
      // Generate code
      const lastCode = db.prepare("SELECT code FROM formulations WHERE code LIKE 'F-%' ORDER BY id DESC LIMIT 1").get();
      let nextNum = 1;
      if (lastCode && lastCode.code) {
        const match = lastCode.code.match(/F-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      const code = data.code || `F-${String(nextNum).padStart(3, '0')}`;

      const stmt = db.prepare(`
        INSERT INTO formulations (project_id, experiment_id, name, code, description, batch_size, batch_unit, total_percentage, status, version, parent_id, mixing_duration, mixing_speed, mixing_temp, mixing_notes, oven_duration, oven_temp, oven_mode, oven_notes, notes, result_notes, result_rating, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const batchSize = data.batch_size || 100;
      let totalPct = 0;

      const result = stmt.run(
        data.project_id || null,
        data.experiment_id || null,
        data.name,
        code,
        data.description || null,
        batchSize,
        data.batch_unit || 'g',
        0,
        data.status || 'draft',
        data.version || 1,
        data.parent_id || null,
        data.mixing_duration || 0,
        data.mixing_speed || null,
        data.mixing_temp || null,
        data.mixing_notes || null,
        data.oven_duration || 0,
        data.oven_temp || null,
        data.oven_mode || null,
        data.oven_notes || null,
        data.notes || null,
        data.result_notes || null,
        data.result_rating || null,
        JSON.stringify(data.tags || [])
      );

      const formulationId = result.lastInsertRowid;

      // Insert items
      if (data.items && data.items.length > 0) {
        const itemStmt = db.prepare(`
          INSERT INTO formulation_items (formulation_id, material_id, material_name, category, percentage, calculated_amount, unit, notes, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        data.items.forEach((item, idx) => {
          const pct = parseFloat(item.percentage) || 0;
          const calc = batchSize * pct / 100;
          totalPct += pct;
          itemStmt.run(
            formulationId,
            item.material_id || null,
            item.material_name,
            item.category || null,
            pct,
            Math.round(calc * 100) / 100,
            item.unit || 'g',
            item.notes || null,
            item.sort_order !== undefined ? item.sort_order : idx
          );
        });

        // Update total percentage
        db.prepare('UPDATE formulations SET total_percentage = ? WHERE id = ?').run(
          Math.round(totalPct * 100) / 100, formulationId
        );
      }

      return formulationId;
    });

    const id = createTx();
    return this.findByIdWithItems(id);
  }

  static update(id, data) {
    const db = getDB();

    const updateTx = db.transaction(() => {
      const fields = [];
      const params = [];

      const allowed = ['project_id', 'experiment_id', 'name', 'code', 'description', 'batch_size', 'batch_unit', 'status', 'version', 'parent_id', 'mixing_duration', 'mixing_speed', 'mixing_temp', 'mixing_notes', 'oven_duration', 'oven_temp', 'oven_mode', 'oven_notes', 'notes', 'result_notes', 'result_rating'];
      for (const key of allowed) {
        if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
      }
      if (data.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(data.tags)); }

      if (fields.length > 0) {
        fields.push("updated_at = datetime('now','localtime')");
        params.push(id);
        db.prepare(`UPDATE formulations SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      }

      // Update items if provided
      if (data.items !== undefined) {
        // Delete existing items
        db.prepare('DELETE FROM formulation_items WHERE formulation_id = ?').run(id);

        const batchSize = data.batch_size || db.prepare('SELECT batch_size FROM formulations WHERE id = ?').get(id).batch_size;
        let totalPct = 0;

        if (data.items.length > 0) {
          const itemStmt = db.prepare(`
            INSERT INTO formulation_items (formulation_id, material_id, material_name, category, percentage, calculated_amount, unit, notes, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          data.items.forEach((item, idx) => {
            const pct = parseFloat(item.percentage) || 0;
            const calc = batchSize * pct / 100;
            totalPct += pct;
            itemStmt.run(
              id,
              item.material_id || null,
              item.material_name,
              item.category || null,
              pct,
              Math.round(calc * 100) / 100,
              item.unit || 'g',
              item.notes || null,
              item.sort_order !== undefined ? item.sort_order : idx
            );
          });
        }

        db.prepare("UPDATE formulations SET total_percentage = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(
          Math.round(totalPct * 100) / 100, id
        );
      }
    });

    updateTx();
    return this.findByIdWithItems(id);
  }

  static delete(id) {
    const db = getDB();
    // Items cascade-deleted by FK
    return db.prepare('DELETE FROM formulations WHERE id = ?').run(id);
  }

  static clone(id, newName, newBatchSize) {
    const db = getDB();
    const original = this.findByIdWithItems(id);
    if (!original) return null;

    const batchSize = newBatchSize || original.batch_size;

    const cloneData = {
      project_id: original.project_id,
      experiment_id: original.experiment_id,
      name: newName || `${original.name} - Varyant`,
      description: original.description,
      batch_size: batchSize,
      batch_unit: original.batch_unit,
      status: 'draft',
      version: (original.version || 1) + 1,
      parent_id: original.id,
      mixing_duration: original.mixing_duration,
      mixing_speed: original.mixing_speed,
      mixing_temp: original.mixing_temp,
      mixing_notes: original.mixing_notes,
      oven_duration: original.oven_duration,
      oven_temp: original.oven_temp,
      oven_mode: original.oven_mode,
      oven_notes: original.oven_notes,
      notes: original.notes,
      tags: typeof original.tags === 'string' ? JSON.parse(original.tags || '[]') : (original.tags || []),
      items: (original.items || []).map((item, idx) => ({
        material_id: item.material_id,
        material_name: item.material_name,
        category: item.category,
        percentage: item.percentage,
        unit: item.unit,
        notes: item.notes,
        sort_order: idx
      }))
    };

    return this.create(cloneData);
  }

  static getByExperiment(experimentId) {
    return this.findAll({ experiment_id: experimentId });
  }

  static getByProject(projectId) {
    return this.findAll({ project_id: projectId });
  }

  static recalculate(id) {
    const db = getDB();
    const formulation = db.prepare('SELECT batch_size FROM formulations WHERE id = ?').get(id);
    if (!formulation) return null;

    const items = db.prepare('SELECT * FROM formulation_items WHERE formulation_id = ?').all(id);
    let totalPct = 0;

    const updateItem = db.prepare('UPDATE formulation_items SET calculated_amount = ? WHERE id = ?');
    const recalcTx = db.transaction(() => {
      for (const item of items) {
        const calc = formulation.batch_size * item.percentage / 100;
        updateItem.run(Math.round(calc * 100) / 100, item.id);
        totalPct += item.percentage;
      }
      db.prepare("UPDATE formulations SET total_percentage = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(
        Math.round(totalPct * 100) / 100, id
      );
    });

    recalcTx();
    return this.findByIdWithItems(id);
  }

  static updateBatchSize(id, newSize) {
    const db = getDB();
    db.prepare("UPDATE formulations SET batch_size = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(newSize, id);
    return this.recalculate(id);
  }

  static getNextCode() {
    const db = getDB();
    const last = db.prepare("SELECT code FROM formulations WHERE code LIKE 'F-%' ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (last && last.code) {
      const match = last.code.match(/F-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    return `F-${String(nextNum).padStart(3, '0')}`;
  }

  static countByStatus(projectId) {
    const db = getDB();
    let sql = 'SELECT status, COUNT(*) as count FROM formulations';
    const params = [];
    if (projectId) { sql += ' WHERE project_id = ?'; params.push(projectId); }
    sql += ' GROUP BY status';
    return db.prepare(sql).all(...params);
  }
}

module.exports = Formulation;
