const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await client.connect();
  const gameRes = await client.query('SELECT * FROM "Game" LIMIT 1');
  const game = gameRes.rows[0];
  console.log("Game:", game);
  if (game) {
    const prodRes = await client.query('SELECT * FROM "Produk" WHERE id_game = $1', [game.id]);
    console.log("Products:", prodRes.rows);
  }
  await client.end();
}

main().catch(console.error);
