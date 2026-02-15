import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Database } from 'better-sqlite3';
import { getDb } from './db';

interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hash a password using scrypt.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Validate a password against a hash.
 */
export function validatePassword(password: string, hash: string): boolean {
  try {
    const [salt, key] = hash.split(':');
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
  } catch (e) {
    return false;
  }
}

/**
 * Create a new user.
 */
export function createUser(username: string, password_plain: string, database?: Database): number {
  const db = database || getDb();
  const hash = hashPassword(password_plain);
  
  const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
  const result = stmt.run(username, hash);
  
  return result.lastInsertRowid as number;
}

/**
 * Get a user by username.
 */
export function getUserByName(username: string, database?: Database): User | null {
  const db = database || getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) as User | null;
}

/**
 * Get a user by ID.
 */
export function getUserById(id: number, database?: Database): User | null {
  const db = database || getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | null;
}
