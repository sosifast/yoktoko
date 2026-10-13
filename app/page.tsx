import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";
import { checkRobloxAccount } from "@/app/reseller/profile/actions";
import GameStoreClient from "./components/GameStoreClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. Ambil daftar game dari database
  let games: any[] = [];
  try {
    const gamesRes = await db.query('SELECT * FROM "Game" ORDER BY create_at DESC');
    games = gamesRes.rows;
  } catch (err) {
    console.error("Error fetching games for homepage:", err);
  }

  // 2. Cek apakah pengguna saat ini sudah login
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const userLevel = cookieStore.get("user_level")?.value;
  
  let currentUser: {
    username?: string;
    userLevel?: string;
    robloxUsername?: string;
    robloxAvatarUrl?: string;
  } | null = null;

  if (sessionToken) {
    try {
      const user = await getUserById(sessionToken);
      if (user && user.id) {
        let robloxUsername: string | undefined = undefined;
        let robloxAvatarUrl: string | undefined = undefined;

        // Ambil profil Roblox jika sudah ditautkan
        try {
          const profileRes = await db.query(
            `SELECT roblox_username FROM "user_profile" WHERE id_user::text = $1 LIMIT 1`,
            [user.id]
          );
          if (profileRes.rows.length > 0 && profileRes.rows[0].roblox_username) {
            const rawRobloxName = profileRes.rows[0].roblox_username;
            robloxUsername = rawRobloxName;
            const robloxRes = await checkRobloxAccount(rawRobloxName);
            if (robloxRes.success && robloxRes.user?.avatarUrl) {
              robloxAvatarUrl = robloxRes.user.avatarUrl;
            }
          }
        } catch (e) {
          console.error("Error fetching roblox profile on homepage:", e);
        }

        currentUser = {
          username: user.username || "Reseller",
          userLevel: userLevel || user.level || "reseller",
          robloxUsername,
          robloxAvatarUrl,
        };
      }
    } catch (e) {
      console.error("Error checking session on homepage:", e);
    }
  }

  // 3. Ambil transaksi terbaru untuk live social proof ticker
  let recentOrders: any[] = [];
  try {
    const trxRes = await db.query(`
      SELECT 
        tr.id,
        tr.price,
        tr.create_at,
        g.name as game_name,
        COALESCE(
          (
            SELECT string_agg(p.nama_produk, ', ')
            FROM "Produk" p
            WHERE p.id::text = ANY(string_to_array(tr.id_produk, ','))
          ),
          'Top Up Game'
        ) as product_name
      FROM "transaksi_reseller" tr
      LEFT JOIN "Game" g ON tr.id_game = g.id::text
      ORDER BY tr.create_at DESC
      LIMIT 5
    `);

    recentOrders = trxRes.rows.map((row: any) => {
      let timeAgo = "Baru saja";
      if (row.create_at) {
        const diffMs = Date.now() - new Date(row.create_at).getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 1) {
          timeAgo = "Baru saja";
        } else if (diffMinutes < 60) {
          timeAgo = `${diffMinutes} mnt lalu`;
        } else {
          const diffHours = Math.floor(diffMinutes / 60);
          timeAgo = `${diffHours} jam lalu`;
        }
      }

      return {
        game_name: row.game_name || "Game Top Up",
        product_name: row.product_name,
        price: row.price,
        time_ago: timeAgo,
      };
    });
  } catch (e) {
    console.error("Error fetching recent transactions for homepage:", e);
  }

  return (
    <GameStoreClient
      games={games}
      currentUser={currentUser}
      recentOrders={recentOrders}
    />
  );
}
