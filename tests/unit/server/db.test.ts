import { describe, it, expect } from 'vitest';
import { getDb, initDb } from '../../../server/utils/db';

describe('db utility', () => {
  it('should return a database instance', () => {
    // We use :memory: for testing
    const db = getDb(':memory:');
    expect(db).toBeDefined();
    // better-sqlite3 instance has an 'open' property
    expect(db.open).toBe(true);
    db.close();
  });

  it('should be able to execute a simple query', () => {
    const db = getDb(':memory:');
    db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    db.prepare('INSERT INTO test (name) VALUES (?)').run('test');
    const row = db.prepare('SELECT * FROM test WHERE name = ?').get('test') as { name: string };
    expect(row.name).toBe('test');
    db.close();
  });

  it('should initialize the schema correctly', () => {
    const db = getDb(':memory:');
    initDb(db);

    // Check if tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableNames = tables.map(t => t.name);
    
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('user_settings');
    expect(tableNames).toContain('filesystem');
    
    db.close();
  });
});
