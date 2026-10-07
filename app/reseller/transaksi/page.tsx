export default function TransaksiPage() {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#121212] animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md z-10 px-4 py-4 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Riwayat Transaksi</h1>
        <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-gray-600 dark:text-gray-300">
          <i className="fa-solid fa-filter text-sm"></i>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-[#1a1a1a] shadow-sm mb-1">
        <button className="flex-1 py-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600">
          Selesai
        </button>
        <button className="flex-1 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
          Proses
        </button>
        <button className="flex-1 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
          Gagal
        </button>
      </div>

      {/* Transaction List */}
      <div className="p-4 flex flex-col gap-3">
        {/* Date Group */}
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 mb-1">Hari Ini, 24 Okt 2023</p>
        
        {[
          { title: "Mobile Legends 86 Diamonds", id: "TRX-8829102", price: "Rp 19.500", status: "Sukses", time: "14:30" },
          { title: "Pulsa Telkomsel 50.000", id: "TRX-8829098", price: "Rp 50.500", status: "Sukses", time: "11:15" },
        ].map((trx, idx) => (
          <div key={`t1-${idx}`} className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-check text-green-600 dark:text-green-400"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{trx.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-500">{trx.id}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="text-[10px] text-gray-500">{trx.time}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{trx.price}</p>
              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">{trx.status}</span>
            </div>
          </div>
        ))}

        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-4 mb-1">Kemarin, 23 Okt 2023</p>
        
        {[
          { title: "Free Fire 140 Diamonds", id: "TRX-8828551", price: "Rp 20.000", status: "Sukses", time: "19:45" },
          { title: "Token PLN 100.000", id: "TRX-8828112", price: "Rp 102.500", status: "Sukses", time: "08:10" },
        ].map((trx, idx) => (
          <div key={`t2-${idx}`} className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-check text-green-600 dark:text-green-400"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{trx.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-500">{trx.id}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="text-[10px] text-gray-500">{trx.time}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{trx.price}</p>
              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">{trx.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
