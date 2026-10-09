import Link from "next/link";

export default function VIPCheckoutPage() {
  return (
    <div className="p-4 flex flex-col gap-6 animate-fade-in pb-20">
      <div className="flex items-center gap-4 pt-2">
        <Link href="/reseller/vip/plan" className="w-10 h-10 rounded-full bg-white dark:bg-[#222222] shadow-sm flex items-center justify-center text-gray-700 dark:text-zinc-300 border border-gray-100 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <div>
          <h2 className="text-gray-900 dark:text-white font-bold text-xl leading-tight">Checkout VIP</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Selesaikan pembayaran Anda</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#222222] rounded-3xl p-5 border border-gray-100 dark:border-[#333] shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#FECB2F]/10 rounded-full blur-2xl -mr-5 -mt-5"></div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i className="fa-solid fa-receipt text-[#FECB2F]"></i> Ringkasan Pesanan
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-[#333] pb-4">
            <div>
              <p className="font-bold text-gray-800 dark:text-zinc-200">VIP Tahunan</p>
              <p className="text-xs text-gray-500">Durasi 365 Hari</p>
            </div>
            <p className="font-bold text-gray-900 dark:text-white">Rp 1.200.000</p>
          </div>
          
          <div className="flex justify-between items-center pb-2">
            <p className="text-sm text-gray-500">Biaya Admin</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Rp 0</p>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 dark:border-[#444]">
            <p className="font-bold text-gray-800 dark:text-zinc-200">Total Pembayaran</p>
            <p className="text-lg font-black text-[#FECB2F]">Rp 1.200.000</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#222222] rounded-3xl p-5 border border-gray-100 dark:border-[#333] shadow-md">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i className="fa-solid fa-wallet text-[#FECB2F]"></i> Metode Pembayaran
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="border-2 border-[#FECB2F] bg-[#FECB2F]/10 rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition">
            <i className="fa-solid fa-qrcode text-2xl text-gray-800 dark:text-white"></i>
            <span className="text-xs font-bold text-gray-800 dark:text-white">QRIS</span>
          </div>
          <div className="border border-gray-200 dark:border-[#444] bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#FECB2F] transition">
            <i className="fa-solid fa-building-columns text-2xl text-gray-600 dark:text-gray-400"></i>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Transfer Bank</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-6 text-white text-center shadow-lg relative overflow-hidden mt-4">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <p className="text-sm text-gray-400 mb-2 relative z-10">Bayar sebelum <span className="font-bold text-white">23:59:00</span></p>
        <button className="relative z-10 w-full py-4 rounded-xl bg-gradient-to-r from-[#FECB2F] to-amber-500 text-[#222222] font-black text-sm shadow-[0_0_20px_-5px_#FECB2F] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
          <i className="fa-solid fa-lock text-xs"></i> Bayar Sekarang
        </button>
      </div>
    </div>
  );
}
