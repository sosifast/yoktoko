const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  await client.query(`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
  `);
  console.log('email column added to User table');
  await client.end();
}

run();
