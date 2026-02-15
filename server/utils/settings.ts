import type { Database } from 'better-sqlite3';
import { getDb } from './db';

/**
 * Save user settings.
 */
export function saveSettings(userId: number, settings: Record<string, any>, database?: Database): void {
  const db = database || getDb();
  const settingsJson = JSON.stringify(settings);
  
  const stmt = db.prepare(`
    INSERT INTO user_settings (user_id, settings_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      settings_json = excluded.settings_json,
      updated_at = CURRENT_TIMESTAMP
  `);
  
  stmt.run(userId, settingsJson);
}

/**
 * Get user settings.
 */
export function getSettings(userId: number, database?: Database): Record<string, any> {
  const db = database || getDb();
  const stmt = db.prepare('SELECT settings_json FROM user_settings WHERE user_id = ?');
  const result = stmt.get(userId) as { settings_json: string } | null;
  
  if (!result) {
    return {};
  }
  
  try {
    return JSON.parse(result.settings_json);
  } catch (e) {
    return {};
  }
}
