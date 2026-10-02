"use client";

import Sidebar from "@/app/components/Sidebar";

export default function DashboardPage() {
  return (
    <Sidebar>
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard Overview</h1>
          <p className="mt-2 text-zinc-400">Ringkasan penjualan dan aktivitas hari ini.</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Penjualan", value: "Rp 12.500.000", color: "from-emerald-500 to-green-500" },
            { label: "Total Transaksi", value: "142", color: "from-blue-500 to-cyan-500" },
            { label: "Kategori Aktif", value: "8", color: "from-purple-500 to-pink-500" },
            { label: "Game Terjual", value: "85", color: "from-[#FECB2F] to-orange-500" },
          ].map((stat, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-lg transition-transform hover:-translate-y-1"
            >
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-2xl`}></div>
              <p className="text-sm font-semibold text-zinc-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-white">Transaksi Terbaru</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-[#333] text-zinc-300">
                <tr>
                  <th className="pb-3 font-semibold">ID Transaksi</th>
                  <th className="pb-3 font-semibold">Waktu</th>
                  <th className="pb-3 font-semibold">Item</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="hover:bg-[#2a2a2a]">
                    <td className="py-4">#TRX-00{i}</td>
                    <td className="py-4">10:4{i} AM</td>
                    <td className="py-4">Mobile Legends x{i}</td>
                    <td className="py-4">Rp {i * 150}.000</td>
                    <td className="py-4">
                      <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
                        Selesai
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
