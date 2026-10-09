import { getGames } from "@/app/owner/game/actions";
import Link from "next/link";
import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";

export default async function DashboardPage() {
  const games = await getGames();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  let userName = "Reseller";
  
  if (sessionToken) {
    try {
      const user = await getUserById(sessionToken);
      if (user && user.username) {
        userName = user.username;
      }
    } catch (e) {
      console.error("Error fetching user:", e);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-6 animate-fade-in">
      {/* Header Profile */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-gray-900 dark:text-white font-bold text-lg leading-tight">Halo, {userName}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Premium Member</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 relative">
          <i className="fa-regular fa-bell text-lg"></i>
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      {/* Membership Card - Physical Card Style */}
      <div className="relative w-full max-w-sm mx-auto aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-6 text-white shadow-2xl border border-zinc-700 overflow-hidden flex flex-col justify-between transform transition-transform hover:scale-[1.02]">
        {/* Abstract Background Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FECB2F]/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FECB2F]/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        <div className="absolute inset-0 bg-black/20 opacity-50"></div>

        {/* Card Header (Logo & NFC) */}
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#FECB2F] to-amber-500 text-sm font-black text-black shadow-md">
              Y
            </div>
            <span className="font-bold tracking-widest text-xs text-zinc-300">YOK<span className="text-[#FECB2F]">Entertaiment</span></span>
          </div>
          
          <div className="flex items-center">
            <i className="fa-solid fa-wifi rotate-90 text-zinc-400 text-lg opacity-80"></i>
          </div>
        </div>

        {/* Card Chip */}
        <div className="relative z-10 mt-2">
          <div className="w-10 h-8 bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-600 rounded-md opacity-90 shadow-sm border border-yellow-700/50 flex flex-wrap overflow-hidden">
            <div className="w-[50%] h-[33%] border-r border-b border-yellow-700/30"></div>
            <div className="w-[50%] h-[33%] border-b border-yellow-700/30"></div>
            <div className="w-[50%] h-[33%] border-r border-b border-yellow-700/30"></div>
            <div className="w-[50%] h-[33%] border-b border-yellow-700/30"></div>
            <div className="w-[50%] h-[33%] border-r border-yellow-700/30"></div>
            <div className="w-[50%] h-[33%]"></div>
          </div>
        </div>

        {/* Card Number */}
        <div className="relative z-10 mt-3 mb-1">
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
            <div className="flex items-center justify-end gap-1.5 text-[#FECB2F]">
              <i className="fa-solid fa-crown text-[10px]"></i>
              <p className="font-bold text-sm tracking-widest uppercase italic">Reseller</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 px-1 mt-[-10px]">
        <Link href="/reseller/vip/plan" className="flex-1 bg-white dark:bg-[#222222] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-gray-100 dark:border-[#333] shadow-sm text-gray-700 dark:text-zinc-200">
          <i className="fa-solid fa-arrow-up-right-dots text-[#FECB2F]"></i> Upgrade Plan
        </Link>
        <Link href="/reseller/vip/history" className="flex-1 bg-white dark:bg-[#222222] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-gray-100 dark:border-[#333] shadow-sm text-gray-700 dark:text-zinc-200">
          <i className="fa-solid fa-clock-rotate-left text-[#FECB2F]"></i> Riwayat
        </Link>
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
