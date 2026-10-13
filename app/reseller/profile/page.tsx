import { getResellerProfile } from "./actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import ProfileLogoutButton from "./ProfileLogoutButton";

export const dynamic = "force-dynamic";

export default async function ResellerProfilePage() {
  const profile = await getResellerProfile();

  if (!profile) {
    redirect("/");
  }

  // Query status langganan VIP aktif
  let activeVip: any = null;
  try {
    const vipRes = await db.query(
      `SELECT h.id, h.start_date, h.expired_date, p.paket
       FROM "history_reseller_plan" h
       LEFT JOIN "reseller_plan" p ON h.id_reseller_plan::text = p.id::text
       WHERE h.id_user::text = $1
         AND h.status_pembayaran = 'Success'
         AND h.is_active = 1
         AND h.expired_date > NOW()
       ORDER BY h.expired_date DESC
       LIMIT 1`,
      [profile.id]
    );

    if (vipRes.rows.length > 0) {
      activeVip = vipRes.rows[0];
    }
  } catch (err) {
    console.error("Error fetching VIP status in profile:", err);
  }

  const isVip = activeVip !== null;
  const tierName = activeVip ? activeVip.paket || "VIP" : "Member";

  // Format tanggal bergabung
  let joinedFormatted = "-";
  if (profile.create_at) {
    joinedFormatted = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(profile.create_at));
  }

  // Format tanggal expired VIP
  let expiredFormatted = "";
  if (activeVip && activeVip.expired_date) {
    expiredFormatted = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(activeVip.expired_date));
  }

  return (
    <div className="p-4 flex flex-col gap-5 animate-fade-in pb-12">
      {/* Top Navbar */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Akun Saya</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Pengaturan profil & keanggotaan</p>
        </div>

        <Link
          href="/reseller/notifikasi"
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#222222] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition border border-gray-200 dark:border-[#333]"
          title="Notifikasi"
        >
          <i className="fa-regular fa-bell text-sm"></i>
        </Link>
      </div>

      {/* Profile Card Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-black p-5 text-white border border-zinc-800 shadow-xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#FECB2F]/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#FECB2F] p-0.5 shadow-md flex items-center justify-center overflow-hidden">
            {profile.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt={profile.username}
                className="w-full h-full object-cover rounded-[14px]"
              />
            ) : (
              <div className="w-full h-full rounded-[14px] bg-zinc-900 flex items-center justify-center text-2xl font-black text-[#FECB2F]">
                {profile.username ? profile.username.charAt(0).toUpperCase() : "R"}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white truncate">{profile.username}</h2>
              {isVip ? (
                <span className="px-2 py-0.5 rounded-full bg-[#FECB2F]/20 text-[#FECB2F] text-[10px] font-bold border border-[#FECB2F]/40 flex items-center gap-1">
                  <i className="fa-solid fa-crown text-[9px]"></i> {tierName}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-semibold border border-zinc-700">
                  Member
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {profile.email || "Email belum didaftarkan"}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">
              Bergabung sejak {joinedFormatted}
            </p>
          </div>
        </div>

        {/* VIP Status Banner */}
        <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <i className={`fa-solid ${isVip ? "fa-circle-check text-emerald-400" : "fa-shield-halved text-[#FECB2F]"}`}></i>
            {isVip ? (
              <span>VIP Aktif s/d <strong className="text-zinc-200">{expiredFormatted}</strong></span>
            ) : (
              <span>Paket Regular (Non-VIP)</span>
            )}
          </span>
          <Link
            href="/reseller/vip/plan"
            className="text-[11px] font-bold text-[#FECB2F] hover:underline flex items-center gap-1"
          >
            {isVip ? "Perpanjang" : "Upgrade VIP"} <i className="fa-solid fa-chevron-right text-[9px]"></i>
          </Link>
        </div>
      </div>

      {/* Linked Accounts: Roblox & TikTok */}
      <div className="grid grid-cols-2 gap-3">
        {/* Roblox Account */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-3.5 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400 text-xs">
            <i className="fa-solid fa-cube text-red-500 text-xs"></i>
            <span className="font-semibold text-[11px]">Akun Roblox</span>
          </div>
          <p className="text-xs font-bold text-gray-900 dark:text-white truncate mt-0.5">
            {profile.roblox_username || <span className="text-gray-400 dark:text-zinc-500 font-normal italic">Belum diatur</span>}
          </p>
        </div>

        {/* TikTok Account */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-3.5 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400 text-xs">
            <i className="fa-brands fa-tiktok text-pink-500 text-xs"></i>
            <span className="font-semibold text-[11px]">Akun TikTok</span>
          </div>
          {profile.tiktok_url ? (
            <a
              href={profile.tiktok_url.startsWith("http") ? profile.tiktok_url : `https://${profile.tiktok_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline truncate mt-0.5 flex items-center gap-1"
            >
              <span className="truncate">{profile.tiktok_url.replace(/https?:\/\/(www\.)?tiktok\.com\/@?/, "@")}</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[9px] shrink-0"></i>
            </a>
          ) : (
            <p className="text-xs text-gray-400 dark:text-zinc-500 font-normal italic mt-0.5">
              Belum diatur
            </p>
          )}
        </div>
      </div>

      {/* Saldo / Balance Card */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center text-lg border border-amber-500/20">
            <i className="fa-solid fa-wallet"></i>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">Saldo Akun Reseller</p>
            <p className="text-base font-extrabold text-gray-900 dark:text-white">
              Rp {Number(profile.balance || 0).toLocaleString("id-ID")}
            </p>
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
          Aktif
        </span>
      </div>

      {/* Primary Feature: Update Account Button */}
      <Link
        href="/reseller/profile/update-account"
        className="group p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/30 hover:border-amber-500/60 transition-all flex items-center justify-between shadow-sm active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-[#FECB2F] text-zinc-950 flex items-center justify-center text-base shadow-sm group-hover:scale-105 transition-transform">
            <i className="fa-solid fa-user-pen"></i>
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              Update Akun
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FECB2F] text-zinc-950 font-black">
                Edit
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Ganti username, email, dan kata sandi akun
            </p>
          </div>
        </div>
        <i className="fa-solid fa-chevron-right text-gray-400 dark:text-zinc-500 group-hover:text-[#FECB2F] group-hover:translate-x-0.5 transition-all text-xs"></i>
      </Link>

      {/* Account Menu List */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200/80 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col divide-y divide-gray-100 dark:divide-zinc-800/80">
        <Link
          href="/reseller/vip/plan"
          className="p-3.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 flex items-center justify-between transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-sm">
              <i className="fa-solid fa-crown"></i>
            </div>
            <div>
              <p className="font-semibold text-xs text-gray-900 dark:text-white">Langganan Paket VIP</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">Pilih & perpanjang tier VIP reseller</p>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right text-gray-400 dark:text-zinc-500 text-xs"></i>
        </Link>

        <Link
          href="/reseller/vip/history"
          className="p-3.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 flex items-center justify-between transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <p className="font-semibold text-xs text-gray-900 dark:text-white">Riwayat Langganan VIP</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">Daftar transaksi upgrade plan VIP</p>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right text-gray-400 dark:text-zinc-500 text-xs"></i>
        </Link>

        <Link
          href="/reseller/transaksi"
          className="p-3.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 flex items-center justify-between transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm">
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div>
              <p className="font-semibold text-xs text-gray-900 dark:text-white">Riwayat Transaksi Game</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">Cek status order & invoice pesanan</p>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right text-gray-400 dark:text-zinc-500 text-xs"></i>
        </Link>

        <Link
          href="/reseller/notifikasi"
          className="p-3.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 flex items-center justify-between transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-sm">
              <i className="fa-solid fa-bell"></i>
            </div>
            <div>
              <p className="font-semibold text-xs text-gray-900 dark:text-white">Notifikasi</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">Informasi update promo & server</p>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right text-gray-400 dark:text-zinc-500 text-xs"></i>
        </Link>
      </div>

      {/* Logout Button */}
      <div className="pt-1">
        <ProfileLogoutButton />
      </div>
    </div>
  );
}
