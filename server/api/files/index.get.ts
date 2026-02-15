import { defineEventHandler } from 'h3';
import { requireUserId } from '../../utils/auth';
import { getDb } from '../../utils/db';
import { getFilesByParent } from '../../utils/filesystem';

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event);
  const db = getDb();
  
  // For now, we return all files owned by the user
  // In a more complex system, we would traverse from root
  const stmt = db.prepare('SELECT * FROM filesystem WHERE owner_id = ?');
  const files = stmt.all(userId);
  
  return {
    files
  };
});
