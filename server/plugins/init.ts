import { defineNitroPlugin } from 'nitropack/runtime/plugin';
import { initDb, getDb } from '../utils/db';
import { createUser, getUserByName } from '../utils/users';

export default defineNitroPlugin((nitroApp) => {
  console.log('Initializing Database...');
  
  try {
    const db = getDb();
    initDb(db);
    
    // Create default user if it doesn't exist
    const defaultUsername = 'Admin';
    const defaultPassword = 'password';
    
    if (!getUserByName(defaultUsername, db)) {
      console.log(`Creating default user: ${defaultUsername}`);
      createUser(defaultUsername, defaultPassword, db);
    }
    
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
});
