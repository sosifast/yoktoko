import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";
import { checkRobloxAccount } from "@/app/reseller/profile/actions";
import GameStoreClient from "./components/GameStoreClient";
import { Analytics } from "@vercel/analytics/next";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. Ambil daftar game dan cookies secara paralel
  let games: any[] = [];
  const [gamesRes, cookieStore] = await Promise.all([
    db.query('SELECT * FROM "Game" ORDER BY create_at DESC').catch((err) => {
      console.error("Error fetching games for homepage:", err);
      return { rows: [] };
    }),
    cookies(),
  ]);

  games = gamesRes.rows;
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

  return (
    <>
      <GameStoreClient
        games={games}
        currentUser={currentUser}
      />
      <Analytics />
    </>
  );
}
