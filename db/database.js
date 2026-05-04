const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(process.env.DB_PATH || './db/la-project.db');

let db;

function getDB() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS project_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(user_id, project_id)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'tubitak',
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','on_hold','cancelled')),
      start_date TEXT,
      end_date TEXT,
      budget REAL DEFAULT 0,
      spent REAL DEFAULT 0,
      pi_name TEXT,
      institution TEXT,
      program TEXT,
      tags TEXT DEFAULT '[]',
      color TEXT DEFAULT '#06b6d4',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      hypothesis TEXT,
      methodology TEXT,
      parameters TEXT DEFAULT '[]',
      status TEXT DEFAULT 'planned' CHECK(status IN ('planned','in_progress','completed','failed','on_hold')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
      start_date TEXT,
      end_date TEXT,
      researcher TEXT,
      results TEXT,
      observations TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_type TEXT DEFAULT 'experiment' CHECK(event_type IN ('experiment','meeting','deadline','maintenance','review')),
      start_datetime TEXT NOT NULL,
      end_datetime TEXT,
      all_day INTEGER DEFAULT 0,
      color TEXT,
      related_experiment_id INTEGER,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (related_experiment_id) REFERENCES experiments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS work_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      number TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      deliverables TEXT DEFAULT '[]',
      progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
      budget REAL DEFAULT 0,
      status TEXT DEFAULT 'planned' CHECK(status IN ('planned','in_progress','completed','delayed','cancelled')),
      dependencies TEXT DEFAULT '[]',
      milestones TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(project_id, number)
    );

    CREATE TABLE IF NOT EXISTS lab_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      author TEXT NOT NULL,
      category TEXT DEFAULT 'note' CHECK(category IN ('observation','measurement','note','issue','idea')),
      content TEXT NOT NULL,
      related_experiment_id INTEGER,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (related_experiment_id) REFERENCES experiments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      model TEXT,
      serial_no TEXT,
      location TEXT,
      status TEXT DEFAULT 'available' CHECK(status IN ('available','in_use','maintenance','out_of_order')),
      last_calibration TEXT,
      next_maintenance TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      quantity REAL DEFAULT 0,
      unit TEXT DEFAULT 'adet',
      min_threshold REAL DEFAULT 0,
      supplier TEXT,
      location TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
      due_date TEXT,
      related_experiment_id INTEGER,
      related_wp_id INTEGER,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (related_experiment_id) REFERENCES experiments(id) ON DELETE SET NULL,
      FOREIGN KEY (related_wp_id) REFERENCES work_packages(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      description TEXT,
      uploaded_by TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS materials_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'toz',
      sub_category TEXT,
      unit TEXT NOT NULL DEFAULT 'g',
      supplier TEXT,
      cas_number TEXT,
      description TEXT,
      density REAL,
      cost_per_unit REAL,
      is_active INTEGER DEFAULT 1,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS formulations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      experiment_id INTEGER REFERENCES experiments(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      batch_size REAL NOT NULL DEFAULT 100,
      batch_unit TEXT NOT NULL DEFAULT 'g',
      total_percentage REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      parent_id INTEGER REFERENCES formulations(id) ON DELETE SET NULL,
      mixing_duration INTEGER DEFAULT 0,
      mixing_speed TEXT,
      mixing_temp REAL,
      mixing_notes TEXT,
      oven_duration INTEGER DEFAULT 0,
      oven_temp REAL,
      oven_mode TEXT,
      oven_notes TEXT,
      notes TEXT,
      result_notes TEXT,
      result_rating INTEGER,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS formulation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formulation_id INTEGER NOT NULL REFERENCES formulations(id) ON DELETE CASCADE,
      material_id INTEGER REFERENCES materials_library(id) ON DELETE SET NULL,
      material_name TEXT NOT NULL,
      category TEXT,
      percentage REAL NOT NULL DEFAULT 0,
      calculated_amount REAL DEFAULT 0,
      unit TEXT DEFAULT 'g',
      notes TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS formulation_comparisons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      experiment_id INTEGER REFERENCES experiments(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS comparison_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comparison_id INTEGER NOT NULL REFERENCES formulation_comparisons(id) ON DELETE CASCADE,
      formulation_id INTEGER NOT NULL REFERENCES formulations(id) ON DELETE CASCADE,
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Seed users if empty
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (userCount.c === 0) {
    console.log('  Kullanicilar olusturuluyor...');
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    const userHash1 = bcrypt.hashSync('user123', 10);
    const userHash2 = bcrypt.hashSync('user123', 10);
    const userHash3 = bcrypt.hashSync('user123', 10);
    const insertUser = db.prepare('INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)');
    insertUser.run('admin', hash, 'Admin', 'admin');
    insertUser.run('kullanici1', userHash1, 'Kullanici 1', 'user');
    insertUser.run('kullanici2', userHash2, 'Kullanici 2', 'user');
    insertUser.run('kullanici3', userHash3, 'Kullanici 3', 'user');
    console.log('  4 kullanici olusturuldu (admin + 3 ekip uyesi)');

  }

  // Seed if tables are empty
  const count = db.prepare('SELECT COUNT(*) as c FROM projects').get();
  if (count.c === 0) {
    console.log('  Veritabani bos, seed verileri yukleniyor...');
    require('./seed');
  }

  // Seed project assignments if empty
  const assignCount = db.prepare('SELECT COUNT(*) as c FROM project_assignments').get();
  if (assignCount.c === 0) {
    const projects = db.prepare('SELECT id FROM projects').all();
    const users = db.prepare('SELECT id FROM users').all();
    if (projects.length > 0 && users.length > 0) {
      const insertAssign = db.prepare('INSERT OR IGNORE INTO project_assignments (user_id, project_id) VALUES (?, ?)');
      for (const p of projects) insertAssign.run(1, p.id);
      for (const p of projects) insertAssign.run(2, p.id);
      if (projects.length > 1) insertAssign.run(3, projects[1].id);
      if (projects.length > 2) insertAssign.run(4, projects[2].id);
      console.log('  Proje atamalari yapildi');
    }
  }

  console.log('  Veritabani hazir.');
}

module.exports = { getDB, initDB };
