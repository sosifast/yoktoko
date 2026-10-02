const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  await client.query(`
    CREATE TABLE IF NOT EXISTS "Kategori" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      create_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      update_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Table Kategori checked/created');
  await client.end();
}

run();
