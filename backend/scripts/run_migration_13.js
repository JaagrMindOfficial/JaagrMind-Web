import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    const sqlPath = path.join(__dirname, '../src/db/migrations/13_library_features.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration 13_library_features.sql...');
    await client.query(sql);
    
    console.log('✅ Migration applied successfully!');
  } catch (err) {
    console.error('❌ Error applying migration:', err);
  } finally {
    await client.end();
  }
}

run();
