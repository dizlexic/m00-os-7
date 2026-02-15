import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, initDb } from '../../../server/utils/db';
import { createUser, getUserByName, validatePassword } from '../../../server/utils/users';
import type { Database } from 'better-sqlite3';

describe('users utility', () => {
  let db: Database;

  beforeEach(() => {
    db = getDb(':memory:');
    initDb(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should create a new user', () => {
    const userId = createUser('testuser', 'password123', db);
    expect(userId).toBeTypeOf('number');
    expect(userId).toBeGreaterThan(0);
  });

  it('should get a user by name', () => {
    createUser('testuser', 'password123', db);
    const user = getUserByName('testuser', db);
    expect(user).toBeDefined();
    expect(user?.username).toBe('testuser');
    expect(user?.password_hash).toBeDefined();
    expect(user?.password_hash).not.toBe('password123');
  });

  it('should validate password correctly', () => {
    createUser('testuser', 'password123', db);
    const user = getUserByName('testuser', db);
    expect(user).toBeDefined();
    if (user) {
      expect(validatePassword('password123', user.password_hash)).toBe(true);
      expect(validatePassword('wrongpassword', user.password_hash)).toBe(false);
    }
  });

  it('should not allow duplicate usernames', () => {
    createUser('testuser', 'password123', db);
    expect(() => createUser('testuser', 'otherpass', db)).toThrow();
  });
});
