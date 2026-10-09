"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  // Sembunyikan bottom nav di halaman order dan plan
  if (pathname.includes('/order/') || pathname.includes('/vip/plan')) return null;

  return (
    <div className="fixed bottom-0 w-full max-w-md bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md flex justify-around items-center h-16 px-2 z-50 shadow-[0_-4px_15px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_15px_-1px_rgba(0,0,0,0.4)]">
      <Link 
        href="/reseller/dashboard" 
        className={`flex flex-col items-center justify-center w-full h-full transition-colors ${pathname === '/reseller/dashboard' ? 'text-[#FECB2F]' : 'text-gray-400 hover:text-[#FECB2F]'}`}
      >
        <i className="fa-solid fa-house text-lg mb-1"></i>
        <span className="text-[10px] font-medium">Dashboard</span>
      </Link>

      <Link 
        href="/reseller/transaksi" 
        className={`flex flex-col items-center justify-center w-full h-full transition-colors ${pathname === '/reseller/transaksi' ? 'text-[#FECB2F]' : 'text-gray-400 hover:text-[#FECB2F]'}`}
      >
        <i className="fa-solid fa-clock-rotate-left text-lg mb-1"></i>
        <span className="text-[10px] font-medium">Transaksi</span>
      </Link>
    </div>
  );
}
