import type { Database } from 'better-sqlite3';
import { getDb } from './db';

export interface FileNode {
  id: string;
  parent_id: string | null;
  name: string;
  type: string;
  content: string | null;
  owner_id: number | null;
  permissions: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save a file node to the database.
 */
export function saveFile(file: FileNode, database?: Database): void {
  const db = database || getDb();

  const stmt = db.prepare(`
    INSERT INTO filesystem (id, parent_id, name, type, content, owner_id, permissions, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      parent_id = excluded.parent_id,
      name = excluded.name,
      type = excluded.type,
      content = excluded.content,
      owner_id = excluded.owner_id,
      permissions = excluded.permissions,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(
    file.id,
    file.parent_id,
    file.name,
    file.type,
    file.content,
    file.owner_id,
    file.permissions
  );
}

/**
 * Get a file node by ID.
 */
export function getFile(id: string, database?: Database): FileNode | null {
  const db = database || getDb();
  const stmt = db.prepare('SELECT * FROM filesystem WHERE id = ?');
  const result = stmt.get(id) as FileNode | undefined;
  return result || null;
}

/**
 * Get file nodes by parent ID.
 */
export function getFilesByParent(parentId: string | null, database?: Database): FileNode[] {
  const db = database || getDb();
  if (parentId === null) {
    const stmt = db.prepare('SELECT * FROM filesystem WHERE parent_id IS NULL');
    return stmt.all() as FileNode[];
  } else {
    const stmt = db.prepare('SELECT * FROM filesystem WHERE parent_id = ?');
    return stmt.all(parentId) as FileNode[];
  }
}

/**
 * Delete a file node by ID.
 */
export function deleteFile(id: string, database?: Database): void {
  const db = database || getDb();
  const stmt = db.prepare('DELETE FROM filesystem WHERE id = ?');
  stmt.run(id);
}
