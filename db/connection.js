import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.DATABASE_SSL === 'true' ? 'require' : false,
  max: 5,
  idle_timeout: 10,
});

export default sql;