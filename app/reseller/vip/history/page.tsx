import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";

export default async function VIPHistoryPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  let userId = "";

  if (sessionToken) {
    try {
      const user = await getUserById(sessionToken);
      if (user && user.id) {
        userId = user.id;
      }
    } catch (e) {
      console.error("Error fetching user:", e);
    }
  }

  let histories: any[] = [];
  
  if (userId) {
    try {
      const result = await db.query(`
        SELECT h.*, p.paket 
        FROM "history_reseller_plan" h
        LEFT JOIN "reseller_plan" p ON h.id_reseller_plan = p.id
        WHERE h.id_user = $1
        ORDER BY h.create_at DESC
      `, [userId]);
      histories = result.rows;

      // Auto-sync jika ada transaksi yang masih 'Pending' tapi punya reference di PG
      const pendingItems = histories.filter((h) => h.status_pembayaran === "Pending" && h.bukti_bayar_url);
      if (pendingItems.length > 0) {
        const isSandbox = process.env.PGKU_MODE === "SANDBOX";
        const baseUrl = isSandbox ? process.env.PGKU_SANDBOX_URL : process.env.PGKU_PRODUCTION_URL;
        const endpoint = isSandbox ? "sandbox/payment/detail" : "production/payment/detail";

        for (const item of pendingItems) {
          try {
            const checkRes = await fetch(`${baseUrl}/${endpoint}?reference=${item.bukti_bayar_url}`, {
              method: "GET",
              headers: {
                api_key: process.env.PGKU_API_KEY!,
                kode_api: process.env.PGKU_KODE_API!,
              },
              cache: "no-store",
            });
            const checkData = await checkRes.json();
            if (checkData.success && (checkData.data?.status === "Success" || checkData.data?.status === "PAID")) {
              const { markPlanPaymentSuccess } = await import("@/lib/payment-service");
              await markPlanPaymentSuccess(item.id, item.bukti_bayar_url);
              item.status_pembayaran = "Success";
              item.is_active = 1;
            }
          } catch (syncErr) {
            console.error("Gagal auto-sync transaksi pending:", syncErr);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching histories:", e);
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
  };

  return (
    <div className="p-4 flex flex-col gap-6 animate-fade-in pb-20">
      <div className="flex items-center gap-4 pt-2">
        <Link href="/reseller/dashboard" className="w-10 h-10 rounded-full bg-white dark:bg-[#222222] shadow-sm flex items-center justify-center text-gray-700 dark:text-zinc-300 border border-gray-100 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <div>
          <h2 className="text-gray-900 dark:text-white font-bold text-xl leading-tight">Riwayat Membership</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Aktivitas langganan VIP Anda</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {histories.length > 0 ? histories.map((history) => {
          const isAktif = history.is_active === 1;
          const statusText = isAktif ? "Aktif" : (history.status_pembayaran !== 'Success' ? history.status_pembayaran : "Berakhir");
          
          return (
            <div key={history.id} className="bg-white dark:bg-[#222222] rounded-2xl p-5 border border-gray-100 dark:border-[#333] shadow-sm relative overflow-hidden transition-all hover:border-[#FECB2F]/50 flex flex-col">
              {/* This link covers the card to view details */}
              <Link href={`/reseller/vip/history/${history.id}/detail`} className="absolute inset-0 z-0"></Link>
              
              {isAktif ? (
                <div className="absolute top-0 right-0 bg-green-500/10 text-green-500 font-bold text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider z-10">
                  <i className="fa-solid fa-circle-check mr-1"></i> Aktif
                </div>
              ) : (
                <div className="absolute top-0 right-0 bg-red-500/10 text-red-500 font-bold text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider z-10">
                  {statusText === 'Pending' ? <i className="fa-solid fa-clock mr-1"></i> : <i className="fa-solid fa-circle-xmark mr-1"></i>} {statusText}
                </div>
              )}

              <div className="flex items-center gap-3 mb-3 mt-2 z-10 pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-[#FECB2F]/20 flex items-center justify-center text-[#FECB2F] shadow-inner">
                  <i className="fa-solid fa-crown"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{history.paket || "Paket VIP"}</h3>
                  <p className="text-xs text-gray-500">ID: {history.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 border border-gray-100 dark:border-[#333] z-10 pointer-events-none">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Mulai</p>
                  <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{formatDate(history.start_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Berakhir</p>
                  <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{formatDate(history.expired_date)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-2 z-10">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Rp {history.price?.toLocaleString("id-ID") || 0}
                </p>
                {!isAktif && history.status_pembayaran !== 'Pending' && (
                  <Link href="/reseller/vip/plan" className="text-xs font-bold text-[#FECB2F] hover:underline relative z-20">
                    Perpanjang <i className="fa-solid fa-arrow-right ml-1"></i>
                  </Link>
                )}
                {!isAktif && history.status_pembayaran === 'Pending' && (
                  <Link href={`/reseller/payment?ref=${history.bukti_bayar_url || history.id}`} className="text-xs font-bold bg-[#FECB2F] text-black px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors relative z-20">
                    Bayar Sekarang
                  </Link>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-10 text-gray-500 text-sm">
            Belum ada riwayat membership.
          </div>
        )}
      </div>
    </div>
  );
}
