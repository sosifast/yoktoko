const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await pool.query('ALTER TABLE "Transaksi" ADD COLUMN IF NOT EXISTS diskon DOUBLE PRECISION DEFAULT 0');
    console.log("Column 'diskon' added successfully.");
  } catch (err) {
    console.error("Error adding column:", err);
  } finally {
    await pool.end();
  }
}

main();
