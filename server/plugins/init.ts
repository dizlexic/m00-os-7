import { defineNitroPlugin } from 'nitropack/runtime/plugin';
import { initDb, getDb } from '../utils/db';
import { createUser, getUserByName } from '../utils/users';

export default defineNitroPlugin((nitroApp) => {
  console.log('Initializing Database...');
  
  try {
    const db = getDb();
    initDb(db);
    
    // Create default Admin user only in development mode
    // This prevents security risks from hardcoded credentials in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      const defaultUsername = 'Admin';
      const defaultPassword = 'password';
      
      if (!getUserByName(defaultUsername, db)) {
        console.log(`Creating default user: ${defaultUsername}`);
        createUser(defaultUsername, defaultPassword, db);
      }
    }
    
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
});
