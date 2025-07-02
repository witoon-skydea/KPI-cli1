import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const sqlite = new Database('kpi.db');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export function closeDatabase(): void {
  sqlite.close();
}