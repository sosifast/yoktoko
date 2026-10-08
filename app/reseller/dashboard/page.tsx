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

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10 blur-lg"></div>
        
        <p className="text-blue-100 text-sm font-medium mb-1 relative z-10">Total Saldo</p>
        <div className="flex items-end gap-2 mb-4 relative z-10">
          <span className="text-sm font-bold pb-1">Rp</span>
          <h1 className="text-3xl font-extrabold tracking-tight">1.250.000</h1>
        </div>
        
        <div className="flex gap-3 relative z-10">
          <button className="flex-1 bg-white/20 hover:bg-white/30 transition backdrop-blur-sm py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            <i className="fa-solid fa-plus"></i> Top Up
          </button>
          <button className="flex-1 bg-white/20 hover:bg-white/30 transition backdrop-blur-sm py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            <i className="fa-solid fa-arrow-right-arrow-left"></i> Transfer
          </button>
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
