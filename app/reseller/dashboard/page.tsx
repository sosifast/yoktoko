import { getGames } from "@/app/owner/game/actions";
import Link from "next/link";
import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";
import LogoutButton from "./LogoutButton";
import { db } from "@/lib/db";
import RecentTransactionsSection from "./RecentTransactionsSection";
import { checkRobloxAccount } from "@/app/reseller/profile/actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const games = await getGames();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  let userName = "Reseller";
  let userId = "";
  let activeVip: {
    id: string;
    paket: string;
    expired_date: Date | string;
    start_date: Date | string;
  } | null = null;
  let recentTransactions: any[] = [];
  let robloxUsername: string | null = null;
  let robloxUser: {
    id: number;
    name: string;
    displayName: string;
    avatarUrl: string;
  } | null = null;
  
  if (sessionToken) {
    try {
      const user = await getUserById(sessionToken);
      if (user && user.id) {
        userId = String(user.id);
        userName = user.username || "Reseller";

        // Query profil Roblox dari tabel user_profile & panggil Roblox API
        try {
          const profileRes = await db.query(
            `SELECT roblox_username FROM "user_profile" WHERE id_user::text = $1 LIMIT 1`,
            [user.id]
          );
          if (profileRes.rows.length > 0 && profileRes.rows[0].roblox_username) {
            robloxUsername = profileRes.rows[0].roblox_username;
            const robloxRes = await checkRobloxAccount(robloxUsername!);
            if (robloxRes.success && robloxRes.user) {
              robloxUser = robloxRes.user;
            }
          }
        } catch (profErr) {
          console.error("Error fetching user roblox profile on dashboard:", profErr);
        }

        // Query status langganan VIP aktif
        const vipRes = await db.query(`
          SELECT h.id, h.start_date, h.expired_date, p.paket
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
          activeVip = vipRes.rows[0];
        }

        // Query 5 transaksi reseller terbaru
        const trxRes = await db.query(`
          SELECT 
            tr.id,
            tr.invoice,
            tr.price,
            tr.status_pembayaran,
            tr.status_transaksi,
            tr.kode_server_join,
            tr.create_at,
            COALESCE(
              (
                SELECT string_agg(p.nama_produk, ', ')
                FROM "Produk" p
                WHERE p.id::text = ANY(string_to_array(tr.id_produk, ','))
              ),
              'Produk Reseller'
            ) as nama_produk,
            g.name as game_name
          FROM "transaksi_reseller" tr
          LEFT JOIN "Game" g ON tr.id_game = g.id::text
          WHERE tr.id_user::text = $1::text
          ORDER BY tr.create_at DESC
          LIMIT 5
        `, [user.id]);

        recentTransactions = trxRes.rows;
      }
    } catch (e) {
      console.error("Error fetching user/VIP status or transactions:", e);
    }
  }

  const isVip = activeVip !== null;
  const tierName = activeVip ? (activeVip.paket || "VIP") : "Member";

  // Format tanggal expired
  let expiredFormatted = "";
  let validThruShort = "";
  if (activeVip && activeVip.expired_date) {
    const expDate = new Date(activeVip.expired_date);
    expiredFormatted = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(expDate);

    const mm = String(expDate.getMonth() + 1).padStart(2, "0");
    const yy = String(expDate.getFullYear()).slice(-2);
    validThruShort = `${mm}/${yy}`;
  }

  return (
    <div className="p-4 flex flex-col gap-6 animate-fade-in">
      {/* Top Bar Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/reseller/profile"
          className="flex items-center gap-3.5 px-3.5 py-2 rounded-full bg-gray-100 dark:bg-zinc-800/90 border border-gray-200/80 dark:border-zinc-700/70 hover:border-[#FECB2F]/60 transition-all group active:scale-95 shadow-sm"
          title="Profil Roblox"
        >
          <div className="w-14 h-14 rounded-full bg-zinc-900 border-2 border-[#FECB2F]/40 overflow-hidden flex items-center justify-center shadow-md shrink-0 relative">
            {robloxUser?.avatarUrl ? (
              <img
                src={robloxUser.avatarUrl}
                alt={robloxUser.name}
                className="w-full h-full object-cover scale-115 group-hover:scale-125 transition-transform"
              />
            ) : (
              <i className="fa-solid fa-cube text-[#FECB2F] text-2xl"></i>
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-semibold leading-tight flex items-center gap-1.5">
              <i className="fa-solid fa-cube text-red-500 text-[10px]"></i> Akun Roblox
            </span>
            <span className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white group-hover:text-[#FECB2F] transition-colors leading-tight truncate max-w-[130px] sm:max-w-[150px] mt-0.5">
              {robloxUser ? (robloxUser.displayName || robloxUser.name) : (robloxUsername || "Tautkan Akun")}
            </span>
          </div>
          <i className="fa-solid fa-chevron-right text-xs text-gray-400 group-hover:text-[#FECB2F] ml-1 transition-colors pr-1"></i>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/reseller/notifikasi"
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 relative hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Notifikasi"
          >
            <i className="fa-regular fa-bell text-lg"></i>
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* Unified Membership Card */}
      <div className="relative w-full rounded-3xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-black p-5 sm:p-6 text-white shadow-2xl border border-zinc-800 overflow-hidden flex flex-col gap-4 transform transition-all">
        {/* Luxury Background Glow Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FECB2F]/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/10 rounded-full -ml-10 -mb-10 blur-3xl pointer-events-none"></div>

        {/* Card Header: Chip, Contactless & Tier Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Realistic EMV Chip */}
            <div className="w-10 h-7 bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-600 rounded-md shadow-sm border border-yellow-700/40 flex flex-wrap overflow-hidden p-0.5">
              <div className="w-[50%] h-[33%] border-r border-b border-amber-900/30"></div>
              <div className="w-[50%] h-[33%] border-b border-amber-900/30"></div>
              <div className="w-[50%] h-[33%] border-r border-b border-amber-900/30"></div>
              <div className="w-[50%] h-[33%] border-b border-amber-900/30"></div>
              <div className="w-[50%] h-[33%] border-r border-amber-900/30"></div>
              <div className="w-[50%] h-[33%]"></div>
            </div>
            <i className="fa-solid fa-wifi rotate-90 text-zinc-500 text-xs"></i>
          </div>

          {/* Tier Badge */}
          {isVip ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FECB2F]/15 border border-[#FECB2F]/40 text-[#FECB2F] shadow-sm">
              <i className="fa-solid fa-crown text-[11px]"></i>
              <span className="font-bold text-xs uppercase tracking-wider">{tierName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300">
              <i className="fa-solid fa-user text-[10px] text-zinc-400"></i>
              <span className="font-bold text-xs uppercase tracking-wider">MEMBER</span>
            </div>
          )}
        </div>

        {/* Cardholder Name & Expiry / Status */}
        <div className="relative z-10 flex items-end justify-between pt-2">
          <div>
            <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-semibold">Cardholder Name</p>
            <p className="font-bold text-sm tracking-wider uppercase text-zinc-100 mt-0.5">{userName}</p>
          </div>

          <div className="text-right">
            {isVip ? (
              <div>
                <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-semibold">Valid Thru</p>
                <p className="font-mono font-bold text-xs text-[#FECB2F] tracking-wider mt-0.5">{validThruShort || expiredFormatted}</p>
              </div>
            ) : (
              <div>
                <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-semibold">Status</p>
                <p className="font-semibold text-xs text-zinc-400 mt-0.5">Non-VIP</p>
              </div>
            )}
          </div>
        </div>

        {/* Integrated Status & Actions Dock */}
        <div className="relative z-10 pt-3.5 border-t border-zinc-800/90 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              {isVip ? (
                <>
                  <i className="fa-solid fa-circle-check text-emerald-400 text-xs"></i>
                  <span>VIP Aktif s/d <strong className="text-zinc-200">{expiredFormatted}</strong></span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-shield-halved text-[#FECB2F] text-xs"></i>
                  <span>Belum berlangganan VIP</span>
                </>
              )}
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/reseller/vip/plan"
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-[0.98]"
            >
              <i className="fa-solid fa-arrow-up-right-dots text-xs"></i>
              <span>{isVip ? "Perpanjang VIP" : "Upgrade Plan"}</span>
            </Link>
            <Link
              href="/reseller/vip/history"
              className="py-2.5 px-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <i className="fa-solid fa-clock-rotate-left text-xs text-[#FECB2F]"></i>
              <span>Riwayat</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Menu */}
      <div>
        <h3 className="text-gray-800 dark:text-gray-200 font-bold mb-3 px-1">Game List</h3>
        <div className="grid grid-cols-4 gap-4">
          {games.length > 0 ? games.slice(0, 8).map((game: any) => (
            <Link href={`/reseller/order/${game.slug}`} key={game.id} className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                {game.image_url ? (
                  <img src={game.image_url} alt={game.name} className="w-full h-full object-cover" />
                ) : (
                  <i className="fa-solid fa-gamepad text-gray-400 text-2xl"></i>
                )}
              </div>
              <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center leading-tight">{game.name}</span>
            </Link>
          )) : (
            <div className="col-span-4 text-center text-xs text-gray-500 py-4">Belum ada game.</div>
          )}
        </div>
      </div>

      {/* 5 Transaksi Terbaru (Realtime Pusher) */}
      <RecentTransactionsSection initialTransactions={recentTransactions} userId={userId} />
    </div>
  );
}
