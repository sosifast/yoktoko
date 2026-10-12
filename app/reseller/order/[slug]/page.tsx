import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";
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

  // Cek status keanggotaan VIP user
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  let isVip = false;
  let vipPlanName = "";

  if (sessionToken) {
    try {
      const user = await getUserById(sessionToken);
      if (user && user.id) {
        const vipRes = await db.query(`
          SELECT h.id, p.paket
          FROM "history_reseller_plan" h
          LEFT JOIN "reseller_plan" p ON h.id_reseller_plan::text = p.id::text
          WHERE h.id_user::text = $1
            AND h.status_pembayaran = 'Success'
            AND h.is_active = 1
            AND h.expired_date > NOW()
          ORDER BY h.expired_date DESC
          LIMIT 1
        `, [user.id]);

        if (vipRes.rows.length > 0) {
          isVip = true;
          vipPlanName = vipRes.rows[0].paket || "VIP";
        }
      }
    } catch (e) {
      console.error("Error checking VIP status for order page:", e);
    }
  }

  return <OrderClient game={game} products={products} isVip={isVip} vipPlanName={vipPlanName} />;
}

