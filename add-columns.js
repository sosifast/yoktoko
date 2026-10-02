const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  await client.query(`
    ALTER TABLE "Produk"
    ADD COLUMN IF NOT EXISTS harga_robux_sebelum_diskon NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS harga_robux_sudah_diskon NUMERIC DEFAULT 0;
  `);
  console.log('Columns added to Produk table');
  await client.end();
}

run();
