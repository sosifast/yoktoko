const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    await client.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS balance DOUBLE PRECISION DEFAULT 0;');
    console.log('Successfully added balance column to Prisma database!');
  } catch (error) {
    console.error('Failed to add column:', error.message);
  } finally {
    await client.end();
  }
}

run();
