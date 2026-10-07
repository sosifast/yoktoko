const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "reseller_plan" (
        "id" TEXT NOT NULL,
        "paket" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "durasi" INTEGER NOT NULL,
        "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "update_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "reseller_plan_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "history_reseller_plan" (
        "id" TEXT NOT NULL,
        "id_reseller_plan" TEXT NOT NULL,
        "id_user" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "start_date" TIMESTAMP(3) NOT NULL,
        "expired_date" TIMESTAMP(3) NOT NULL,
        "bukti_bayar_url" TEXT,
        "status_pembayaran" TEXT NOT NULL DEFAULT 'Pending',
        "is_active" INTEGER NOT NULL DEFAULT 0,
        "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "update_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "history_reseller_plan_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('Successfully created reseller_plan and history_reseller_plan tables!');
  } catch (error) {
    console.error('Failed to create tables:', error.message);
  } finally {
    await client.end();
  }
}

run();
