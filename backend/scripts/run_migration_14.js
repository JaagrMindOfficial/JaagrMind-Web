import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'; // No destructuring here based on previous error

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const migrationPath = path.resolve(__dirname, '../src/db/migrations/14_enable_uuid_ossp.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await client.query('BEGIN');
    await client.query(migrationSql);
    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
