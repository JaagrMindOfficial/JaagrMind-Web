import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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
  console.log('Connecting to database...');
  const client = await pool.connect();
  try {
    const migrationPath = path.resolve(__dirname, '../src/db/migrations/15_denormalize_counts.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at ${migrationPath}`);
    }
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running 15_denormalize_counts.sql...');
    // Split by statement if needed, but for now assuming it can run as a block or we just run it directly.
    // Ideally we should check if migration already ran, but for this task we assume we want to apply it.
    
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
