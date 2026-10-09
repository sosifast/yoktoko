import Link from "next/link";

export default function VIPHistoryPage() {
  const histories = [
    {
      id: "H001",
      paket: "VIP Tahunan",
      price: 1200000,
      start_date: "08 Okt 2026",
      expired_date: "08 Okt 2027",
      status: "Aktif",
    },
    {
      id: "H002",
      paket: "VIP Bulanan",
      price: 150000,
      start_date: "08 Sep 2026",
      expired_date: "08 Okt 2026",
      status: "Berakhir",
    }
  ];

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
        {histories.map((history) => (
          <div key={history.id} className="bg-white dark:bg-[#222222] rounded-2xl p-5 border border-gray-100 dark:border-[#333] shadow-sm relative overflow-hidden transition-all hover:border-[#FECB2F]/50">
            {history.status === "Aktif" && (
              <div className="absolute top-0 right-0 bg-green-500/10 text-green-500 font-bold text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                <i className="fa-solid fa-circle-check mr-1"></i> Aktif
              </div>
            )}
            {history.status === "Berakhir" && (
              <div className="absolute top-0 right-0 bg-red-500/10 text-red-500 font-bold text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                <i className="fa-solid fa-circle-xmark mr-1"></i> Berakhir
              </div>
            )}

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FECB2F]/20 flex items-center justify-center text-[#FECB2F] shadow-inner">
                <i className="fa-solid fa-crown"></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{history.paket}</h3>
                <p className="text-xs text-gray-500">ID: {history.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 border border-gray-100 dark:border-[#333]">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Mulai</p>
                <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{history.start_date}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Berakhir</p>
                <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{history.expired_date}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Rp {history.price.toLocaleString("id-ID")}
              </p>
              {history.status === "Berakhir" && (
                <Link href="/reseller/vip/plan" className="text-xs font-bold text-[#FECB2F] hover:underline">
                  Perpanjang <i className="fa-solid fa-arrow-right ml-1"></i>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
