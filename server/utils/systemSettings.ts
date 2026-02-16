import { Database } from 'better-sqlite3';
import { getDb } from './db';

/**
 * Get a system setting by key.
 */
export function getSystemSetting(key: string, database?: Database): string | null {
  const db = database || getDb();
  const stmt = db.prepare('SELECT value FROM system_settings WHERE key = ?');
  const result = stmt.get(key) as { value: string } | null;
  
  return result ? result.value : null;
}

/**
 * Set a system setting.
 */
export function setSystemSetting(key: string, value: string, database?: Database): void {
  const db = database || getDb();
  const stmt = db.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `);
  
  stmt.run(key, value);
}

/**
 * Get all system settings as an object.
 */
export function getAllSystemSettings(database?: Database): Record<string, string> {
  const db = database || getDb();
  const stmt = db.prepare('SELECT key, value FROM system_settings');
  const results = stmt.all() as { key: string, value: string }[];
  
  const settings: Record<string, string> = {};
  for (const row of results) {
    settings[row.key] = row.value;
  }
  
  return settings;
}
