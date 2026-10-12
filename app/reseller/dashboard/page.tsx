import { getGames } from "@/app/owner/game/actions";
import Link from "next/link";
import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";
import LogoutButton from "./LogoutButton";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const games = await getGames();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  let userName = "Reseller";
  let activeVip: {
    id: string;
    paket: string;
    expired_date: Date | string;
    start_date: Date | string;
  } | null = null;
  
  if (sessionToken) {
    try {
      const user = await getUserById(sessionToken);
      if (user && user.id) {
        userName = user.username || "Reseller";

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
      }
    } catch (e) {
      console.error("Error fetching user/VIP status:", e);
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
      <div className="flex items-center justify-end gap-2 pt-2">
        <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 relative">
          <i className="fa-regular fa-bell text-lg"></i>
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <LogoutButton />
      </div>

      {/* Membership Section (Card, Status Tier, Buttons aligned) */}
      <div className="flex flex-col gap-3">
        {/* Membership Card - Physical Card Style */}
        <div className="relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-6 text-white shadow-2xl border border-zinc-700 overflow-hidden flex flex-col justify-between transform transition-transform hover:scale-[1.01]">
          {/* Abstract Background Effects */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FECB2F]/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FECB2F]/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
          <div className="absolute inset-0 bg-black/20 opacity-50"></div>

          {/* Card Chip & Valid Thru */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-8 bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-600 rounded-md opacity-90 shadow-sm border border-yellow-700/50 flex flex-wrap overflow-hidden">
              <div className="w-[50%] h-[33%] border-r border-b border-yellow-700/30"></div>
              <div className="w-[50%] h-[33%] border-b border-yellow-700/30"></div>
              <div className="w-[50%] h-[33%] border-r border-b border-yellow-700/30"></div>
              <div className="w-[50%] h-[33%] border-b border-yellow-700/30"></div>
              <div className="w-[50%] h-[33%] border-r border-yellow-700/30"></div>
              <div className="w-[50%] h-[33%]"></div>
            </div>
            {isVip && validThruShort && (
              <div className="text-right">
                <span className="text-[8px] text-zinc-400 uppercase tracking-widest block leading-tight">VALID THRU</span>
                <span className="font-mono text-xs font-semibold text-zinc-200 tracking-wider">{validThruShort}</span>
              </div>
            )}
          </div>

          {/* Card Number */}
          <div className="relative z-10 my-auto">
            <p className="font-mono text-xl tracking-[0.2em] text-zinc-100 drop-shadow-md" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>
              4455 1122 3344 5566
            </p>
          </div>

          {/* Card Footer (Name, Tier) */}
          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-[9px] text-zinc-400 uppercase tracking-widest mb-0.5">Cardholder Name</p>
              <p className="font-bold text-sm tracking-widest uppercase">{userName}</p>
            </div>
            
            <div className="text-right">
              <p className="text-[9px] text-zinc-400 uppercase tracking-widest mb-0.5">Member Tier</p>
              {isVip ? (
                <div className="flex items-center justify-end gap-1.5 text-[#FECB2F]">
                  <i className="fa-solid fa-crown text-[10px]"></i>
                  <p className="font-bold text-sm tracking-widest uppercase italic">{tierName}</p>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-1.5 text-zinc-300">
                  <i className="fa-solid fa-user text-[10px] text-zinc-400"></i>
                  <p className="font-bold text-sm tracking-widest uppercase italic">Member</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tier & Subscription Status Details */}
        {isVip ? (
          <div className="w-full bg-white dark:bg-[#222222] border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FECB2F]/10 flex items-center justify-center text-[#FECB2F]">
                <i className="fa-solid fa-crown text-base"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">Tier: {tierName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 font-semibold">Aktif</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Expired: <span className="text-gray-700 dark:text-zinc-200 font-medium">{expiredFormatted}</span>
                </p>
              </div>
            </div>
            <Link href="/reseller/vip/plan" className="text-xs font-semibold text-[#FECB2F] hover:underline flex items-center gap-1">
              Perpanjang <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </Link>
          </div>
        ) : (
          <div className="w-full bg-white dark:bg-[#222222] border border-gray-100 dark:border-[#333] rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400">
                <i className="fa-solid fa-user text-base"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">Tier: Member</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-semibold">Gratis</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Belum berlangganan VIP
                </p>
              </div>
            </div>
            <Link href="/reseller/vip/plan" className="text-xs font-semibold text-[#FECB2F] hover:underline flex items-center gap-1">
              Beli VIP <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </Link>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex gap-3">
          <Link href="/reseller/vip/plan" className="flex-1 bg-white dark:bg-[#222222] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-gray-100 dark:border-[#333] shadow-sm text-gray-700 dark:text-zinc-200">
            <i className="fa-solid fa-arrow-up-right-dots text-[#FECB2F]"></i> Upgrade Plan
          </Link>
          <Link href="/reseller/vip/history" className="flex-1 bg-white dark:bg-[#222222] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-gray-100 dark:border-[#333] shadow-sm text-gray-700 dark:text-zinc-200">
            <i className="fa-solid fa-clock-rotate-left text-[#FECB2F]"></i> Riwayat
          </Link>
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

      {/* Banner / Promo */}
      <div className="w-full h-32 rounded-2xl bg-gradient-to-r from-orange-400 to-rose-500 p-4 flex items-center justify-between shadow-lg relative overflow-hidden mt-2">
        <div className="relative z-10 text-white w-2/3">
          <h3 className="font-bold text-lg leading-tight mb-1">Promo Cashback!</h3>
          <p className="text-xs opacity-90 mb-3">Top up minimal Rp 100rb dapatkan cashback s.d 50%</p>
          <span className="text-[10px] font-bold bg-white text-rose-500 px-3 py-1 rounded-full uppercase tracking-wider">Klaim Sekarang</span>
        </div>
        <i className="fa-solid fa-gift text-6xl text-white/20 absolute -right-2 -bottom-2 -rotate-12"></i>
      </div>
    </div>
  );
}
