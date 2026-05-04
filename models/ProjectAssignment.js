const { getDB } = require('../db/database');

const ProjectAssignment = {
  getProjectIds(userId) {
    const rows = getDB().prepare('SELECT project_id FROM project_assignments WHERE user_id = ?').all(userId);
    return rows.map(r => r.project_id);
  },

  getByUser(userId) {
    return getDB().prepare(`
      SELECT pa.*, p.name as project_name, p.code as project_code, p.color as project_color
      FROM project_assignments pa
      JOIN projects p ON p.id = pa.project_id
      WHERE pa.user_id = ?
      ORDER BY p.name
    `).all(userId);
  },

  getByProject(projectId) {
    return getDB().prepare(`
      SELECT pa.*, u.username, u.display_name, u.role
      FROM project_assignments pa
      JOIN users u ON u.id = pa.user_id
      WHERE pa.project_id = ?
      ORDER BY u.display_name
    `).all(projectId);
  },

  assign(userId, projectId) {
    return getDB().prepare('INSERT OR IGNORE INTO project_assignments (user_id, project_id) VALUES (?, ?)').run(userId, projectId);
  },

  unassign(userId, projectId) {
    return getDB().prepare('DELETE FROM project_assignments WHERE user_id = ? AND project_id = ?').run(userId, projectId);
  },

  isAssigned(userId, projectId) {
    const row = getDB().prepare('SELECT 1 FROM project_assignments WHERE user_id = ? AND project_id = ?').get(userId, projectId);
    return !!row;
  }
};

module.exports = ProjectAssignment;
