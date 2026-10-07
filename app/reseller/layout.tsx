import Link from "next/link";
import { headers } from "next/headers";

export default async function ResellerLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex justify-center text-sm">
      {/* Mobile container */}
      <div className="w-full max-w-md bg-white dark:bg-[#121212] min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pb-20">
          {children}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 w-full max-w-md bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md flex justify-around items-center h-16 px-2 z-50 shadow-[0_-4px_15px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_15px_-1px_rgba(0,0,0,0.4)]">
          <Link 
            href="/reseller/dashboard" 
            className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-[#FECB2F] transition-colors"
          >
            <i className="fa-solid fa-house text-lg mb-1"></i>
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>

          <Link 
            href="/reseller/transaksi" 
            className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-[#FECB2F] transition-colors"
          >
            <i className="fa-solid fa-clock-rotate-left text-lg mb-1"></i>
            <span className="text-[10px] font-medium">Transaksi</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
