const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  await client.query(`
    CREATE TABLE IF NOT EXISTS "Produk" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      id_kategori UUID REFERENCES "Kategori"(id) ON DELETE CASCADE,
      id_game UUID REFERENCES "Game"(id) ON DELETE CASCADE,
      nama_produk TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      harga_jual NUMERIC NOT NULL,
      rate_robux_suplier NUMERIC,
      rate_robux_dijual NUMERIC,
      create_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      update_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Table Produk checked/created');
  await client.end();
}

run();
