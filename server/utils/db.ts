import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

/**
 * Get or initialize the database instance.
 *
 * @param path - Optional path to the database file. Defaults to data/m00-os-7.db
 * @returns The better-sqlite3 database instance
 */
export function getDb(path?: string): Database.Database {
  if (db && !path) {
    return db;
  }

  const dbPath = path || join(process.cwd(), 'data', 'm00-os-7.db');

  // Ensure data directory exists if not using memory
  if (dbPath !== ':memory:') {
    const dir = dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const instance = new Database(dbPath);

  // Only cache if it's the default path
  if (!path) {
    db = instance;
  }

  return instance;
}

/**
 * Initialize the database schema.
 */
export function initDb(database?: Database.Database): void {
  const connection = database || getDb();

  connection.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      settings_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS filesystem (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      owner_id INTEGER,
      size INTEGER DEFAULT 0,
      is_system INTEGER DEFAULT 0,
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrations: Add size and is_system columns if they don't exist
  try {
    connection.exec('ALTER TABLE filesystem ADD COLUMN size INTEGER DEFAULT 0');
  } catch (e) {
    // Column might already exist
  }
  try {
    connection.exec('ALTER TABLE filesystem ADD COLUMN is_system INTEGER DEFAULT 0');
  } catch (e) {
    // Column might already exist
  }
}
