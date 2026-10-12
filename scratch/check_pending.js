const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const planHistory = await client.query('SELECT id, id_user, status_pembayaran, bukti_bayar_url, create_at FROM "history_reseller_plan" ORDER BY create_at DESC LIMIT 10');
  console.log('--- history_reseller_plan ---');
  console.log(JSON.stringify(planHistory.rows, null, 2));

  const trxReseller = await client.query('SELECT * FROM "transaksi_reseller" ORDER BY create_at DESC LIMIT 10');
  console.log('--- transaksi_reseller ---');
  console.log(JSON.stringify(trxReseller.rows, null, 2));

  const trxOwner = await client.query('SELECT id, status, create_at FROM "Transaksi" WHERE LOWER(status) = \'pending\' ORDER BY create_at DESC LIMIT 10');
  console.log('--- Transaksi (Owner) ---');
  console.log(JSON.stringify(trxOwner.rows, null, 2));

  await client.end();
}

check().catch(console.error);
