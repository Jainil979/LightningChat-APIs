// db/init.js
// One‑time script to create the users table.
// Usage: node db/init.js
import postgres from 'postgres';
import { readFileSync } from 'fs';

try {
  process.loadEnvFile();
} catch {
  // .env file not found – using environment variables from Render
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.DATABASE_SSL === 'true' ? 'require' : false,
  max: 1,
  idle_timeout: 5,
});

const schemaSQL = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');

try {
  await sql.unsafe(schemaSQL);
  console.log('✅ Users table created successfully.');
} catch (err) {
  console.error('❌ Failed to create table:', err);
} finally {
  await sql.end();
  process.exit();
}