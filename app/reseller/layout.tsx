import BottomNav from "./BottomNav";
import { Analytics } from "@vercel/analytics/next";

export default function ResellerLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex justify-center text-sm">
      {/* Mobile container */}
      <div className="w-full max-w-md bg-white dark:bg-[#121212] min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pb-20">
          {children}
        </div>

        <BottomNav />
        <Analytics />
      </div>
    </div>
  );
}
