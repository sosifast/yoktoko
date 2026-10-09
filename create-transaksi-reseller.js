const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS "transaksi_reseller" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "id_user" TEXT NOT NULL,
        "invoice" TEXT NOT NULL UNIQUE,
        "id_produk" TEXT NOT NULL,
        "id_game" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "status_pembayaran" TEXT NOT NULL DEFAULT 'Pending',
        "bukti_status_pembayaran_url" TEXT,
        "username_roblox" TEXT,
        "status_transaksi" TEXT NOT NULL DEFAULT 'Pending',
        "kode_server_join" TEXT,
        "bukti_transaksi_url" TEXT,
        "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "update_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "transaksi_reseller_id_user_idx" ON "transaksi_reseller"("id_user");
      CREATE INDEX IF NOT EXISTS "transaksi_reseller_invoice_idx" ON "transaksi_reseller"("invoice");
      CREATE INDEX IF NOT EXISTS "transaksi_reseller_status_pembayaran_idx" ON "transaksi_reseller"("status_pembayaran");
      CREATE INDEX IF NOT EXISTS "transaksi_reseller_status_transaksi_idx" ON "transaksi_reseller"("status_transaksi");
    `;
    await pool.query(query);
    console.log("Table 'transaksi_reseller' created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await pool.end();
  }
}

main();
