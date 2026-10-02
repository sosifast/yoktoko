const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  // Create table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS "User" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      create_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      update_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Table User checked/created');

  // Insert user
  try {
    await client.query(`
      INSERT INTO "User" (username, password)
      VALUES ('yokentertaiment', 'superadmin')
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('Dummy user inserted or already exists.');
  } catch (err) {
    console.error('Error inserting user:', err);
  }

  await client.end();
}

run();
