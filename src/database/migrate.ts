import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, closeDatabase } from './connection.js';

async function runMigrations(): Promise<void> {
  console.log('Running database migrations...');
  
  try {
    migrate(db, { migrationsFolder: './src/database/migrations' });
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

runMigrations();