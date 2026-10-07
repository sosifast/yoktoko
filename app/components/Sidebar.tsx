"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Dashboard", href: "/owner/dashboard", icon: "fa-solid fa-chart-pie" },
    { name: "POS Transaction", href: "/owner/transaksi", icon: "fa-solid fa-cart-shopping" },
    { name: "Products", href: "/owner/produk", icon: "fa-solid fa-box-open" },
    { name: "Categories", href: "/owner/kategori", icon: "fa-solid fa-folder-open" },
    { name: "Games", href: "/owner/game", icon: "fa-solid fa-gamepad" },
    { name: "Suppliers", href: "/owner/suplier", icon: "fa-solid fa-truck-ramp-box" },
    { name: "Financial Report", href: "/owner/report", icon: "fa-solid fa-file-invoice-dollar" },
    { name: "Reseller Plan", href: "/plan-reseller", icon: "fa-solid fa-crown" },
    { name: "Users", href: "/owner/user", icon: "fa-solid fa-users" },
  ];

  return (
    <div className="flex h-screen w-full bg-[#1a1a1a] font-sans text-white">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-[#333] bg-[#222222]">
        <div className="flex h-20 items-center justify-center border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FECB2F] text-xl font-black text-[#222222] shadow-[0_0_15px_-3px_#FECB2F]">
              Y
            </div>
            <span className="text-xl font-bold tracking-tight text-white">YokPOS</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#FECB2F] text-[#222222] shadow-[0_0_15px_-5px_#FECB2F]"
                    : "text-zinc-400 hover:bg-[#333] hover:text-white"
                }`}
              >
                <i className={`${item.icon} text-base w-5 text-center`}></i>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#333] p-4">
          <button
            onClick={() => router.push("/")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-500"
          >
            <i className="fa-solid fa-right-from-bracket text-base w-5 text-center"></i>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#1a1a1a]">{children}</main>
    </div>
  );
}
