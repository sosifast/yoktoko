const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    await client.query('ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS image_url TEXT;');
    console.log('Successfully added image_url column to Game table!');
  } catch (error) {
    console.error('Failed to add column:', error.message);
  } finally {
    await client.end();
  }
}

run();
