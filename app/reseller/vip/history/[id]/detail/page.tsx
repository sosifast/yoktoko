import Link from "next/link";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";

export default async function VIPHistoryDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const historyId = params.id;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  let userId = "";

  if (sessionToken) {
    try {
      const user = await getUserById(sessionToken);
      if (user && user.id) userId = user.id;
    } catch (e) {
      console.error(e);
    }
  }

  if (!userId) {
    return notFound();
  }

  const result = await db.query(`
    SELECT h.*, p.paket, p.durasi
    FROM "history_reseller_plan" h
    LEFT JOIN "reseller_plan" p ON h.id_reseller_plan = p.id
    WHERE h.id = $1 AND h.id_user = $2
  `, [historyId, userId]);

  if (result.rows.length === 0) {
    return notFound();
  }

  const history = result.rows[0];
  const isAktif = history.is_active === 1;
  const statusText = isAktif ? "Aktif" : (history.status_pembayaran !== 'Success' ? history.status_pembayaran : "Berakhir");
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  };

  return (
    <div className="p-4 flex flex-col gap-6 animate-fade-in pb-20">
      <div className="flex items-center gap-4 pt-2">
        <Link href="/reseller/vip/history" className="w-10 h-10 rounded-full bg-white dark:bg-[#222222] shadow-sm flex items-center justify-center text-gray-700 dark:text-zinc-300 border border-gray-100 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <div>
          <h2 className="text-gray-900 dark:text-white font-bold text-xl leading-tight">Detail Transaksi</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs">ID: {history.id}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#222222] rounded-3xl p-5 border border-gray-100 dark:border-[#333] shadow-md relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-[#333] pb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">Status Transaksi</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${isAktif ? 'bg-green-500/10 text-green-500' : (statusText === 'Pending' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500')}`}>
            {statusText}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Paket Membership</p>
            <p className="font-semibold text-gray-900 dark:text-white">{history.paket || "VIP Plan"}</p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Durasi</p>
            <p className="font-semibold text-gray-900 dark:text-white">{history.durasi} Hari</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Tanggal Mulai</p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatDate(history.start_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tanggal Berakhir</p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatDate(history.expired_date)}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-dashed border-gray-200 dark:border-[#444]">
            <p className="text-xs text-gray-500 mb-1">Total Pembayaran</p>
            <p className="text-2xl font-black text-[#FECB2F]">Rp {history.price?.toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>

      {statusText === 'Pending' && (
        <div className="flex flex-col gap-3">
          <Link href={`/reseller/payment?ref=${history.bukti_bayar_url || history.id}`} className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FECB2F] to-amber-500 text-[#222222] font-black text-sm shadow-[0_0_20px_-5px_#FECB2F] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
            <i className="fa-solid fa-credit-card"></i> Lanjutkan Pembayaran
          </Link>
        </div>
      )}
    </div>
  );
}
