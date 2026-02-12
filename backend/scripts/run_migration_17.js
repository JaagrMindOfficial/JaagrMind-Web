import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationPath = path.join(__dirname, '../src/db/migrations/17_create_users_with_stats_view.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 17_create_users_with_stats_view.sql');
    
    await client.query('BEGIN');
    await client.query(migrationSql);
    await client.query('COMMIT');

    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
