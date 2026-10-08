import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import OrderClient from "./OrderClient";

export default async function GameOrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch Game by slug
  const gameRes = await db.query('SELECT * FROM "Game" WHERE slug = $1 LIMIT 1', [slug]);
  const game = gameRes.rows[0];

  if (!game) {
    notFound();
  }

  // Fetch Products for this game
  const productsRes = await db.query('SELECT * FROM "Produk" WHERE id_game = $1 ORDER BY CAST(harga_jual AS numeric) ASC', [game.id]);
  const products = productsRes.rows;

  return <OrderClient game={game} products={products} />;
}
