const { getDB } = require('../db/database');
const bcrypt = require('bcryptjs');

const User = {
  findAll() {
    return getDB().prepare('SELECT id, username, display_name, role, created_at FROM users ORDER BY id').all();
  },

  findById(id) {
    return getDB().prepare('SELECT id, username, display_name, role, created_at FROM users WHERE id = ?').get(id);
  },

  findByUsername(username) {
    return getDB().prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  async create(data) {
    const hash = await bcrypt.hash(data.password, 10);
    const stmt = getDB().prepare('INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(data.username, hash, data.display_name, data.role || 'user');
    return result.lastInsertRowid;
  },

  async authenticate(username, password) {
    const user = getDB().prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return null;
    return { id: user.id, username: user.username, display_name: user.display_name, role: user.role };
  },

  async changePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    getDB().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
  }
};

module.exports = User;
