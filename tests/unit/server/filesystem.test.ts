import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, initDb } from '../../../server/utils/db';
import { createUser } from '../../../server/utils/users';
import { saveFile, getFile, getFilesByParent, deleteFile } from '../../../server/utils/filesystem';
import type { Database } from 'better-sqlite3';

describe('filesystem utility', () => {
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

  it('should save and load a file', () => {
    const file = {
      id: 'file-1',
      parent_id: 'root',
      name: 'test.txt',
      type: 'document',
      content: 'Hello World',
      owner_id: userId,
      permissions: 'rw-r--r--'
    };
    
    saveFile(file, db);
    
    const loadedFile = getFile('file-1', db);
    expect(loadedFile).toMatchObject(file);
  });

  it('should get files by parent', () => {
    saveFile({ id: 'f1', parent_id: 'root', name: 'f1', type: 'folder' }, db);
    saveFile({ id: 'f2', parent_id: 'root', name: 'f2', type: 'document' }, db);
    saveFile({ id: 'f3', parent_id: 'folder1', name: 'f3', type: 'document' }, db);
    
    const rootFiles = getFilesByParent('root', db);
    expect(rootFiles).toHaveLength(2);
    expect(rootFiles.map(f => f.id)).toContain('f1');
    expect(rootFiles.map(f => f.id)).toContain('f2');
  });

  it('should delete a file', () => {
    saveFile({ id: 'f1', parent_id: 'root', name: 'f1', type: 'document' }, db);
    deleteFile('f1', db);
    
    const loadedFile = getFile('f1', db);
    expect(loadedFile).toBeNull();
  });
});
