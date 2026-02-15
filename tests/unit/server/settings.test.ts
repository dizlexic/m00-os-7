import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, initDb } from '../../../server/utils/db';
import { createUser } from '../../../server/utils/users';
import { saveSettings, getSettings } from '../../../server/utils/settings';
import type { Database } from 'better-sqlite3';

describe('settings utility', () => {
  let db: Database;
  let userId: number;

  beforeEach(() => {
    db = getDb(':memory:');
    initDb(db);
    userId = createUser('testuser', 'password123', db);
  });

  afterEach(() => {
    db.close();
  });

  it('should save and load settings', () => {
    const settings = { theme: 'classic', background: 'pattern1' };
    saveSettings(userId, settings, db);

    const loadedSettings = getSettings(userId, db);
    expect(loadedSettings).toEqual(settings);
  });

  it('should update existing settings', () => {
    saveSettings(userId, { theme: 'classic' }, db);
    saveSettings(userId, { theme: 'dark' }, db);

    const loadedSettings = getSettings(userId, db);
    expect(loadedSettings).toEqual({ theme: 'dark' });
  });

  it('should return empty object if no settings found', () => {
    const loadedSettings = getSettings(userId, db);
    expect(loadedSettings).toEqual({});
  });
});
