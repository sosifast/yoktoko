"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import { useState, useMemo } from "react";

const initialTransactions = [
  { id: "#TRX-001", time: "10:41 AM", item: "Mobile Legends x1", total: 150000, status: "Selesai" },
  { id: "#TRX-002", time: "10:42 AM", item: "Mobile Legends x2", total: 300000, status: "Selesai" },
  { id: "#TRX-003", time: "10:43 AM", item: "Free Fire 1000 Diamond", total: 120000, status: "Selesai" },
  { id: "#TRX-004", time: "10:44 AM", item: "Roblox 500 Robux", total: 65000, status: "Selesai" },
  { id: "#TRX-005", time: "10:45 AM", item: "Genshin Impact Genesis", total: 250000, status: "Selesai" },
  { id: "#TRX-006", time: "11:10 AM", item: "Valorant Points 1650", total: 160000, status: "Selesai" },
  { id: "#TRX-007", time: "11:25 AM", item: "Roblox 1000 Robux", total: 125000, status: "Pending" },
  { id: "#TRX-008", time: "11:40 AM", item: "PUBG Mobile 600 UC", total: 140000, status: "Selesai" },
  { id: "#TRX-009", time: "12:05 PM", item: "Steam Wallet IDR 120K", total: 135000, status: "Selesai" },
  { id: "#TRX-010", time: "12:30 PM", item: "Honkai Star Rail Oneiric", total: 240000, status: "Selesai" },
];

export default function DashboardPage() {
  const [transactions] = useState(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase().trim();
    return transactions.filter(
      (trx) =>
        trx.id.toLowerCase().includes(query) ||
        trx.item.toLowerCase().includes(query) ||
        trx.status.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

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

        {/* Transaksi Terbaru */}
        <div className="mt-8 rounded-2xl border border-white/5 bg-[#222222] shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Transaksi Terbaru</h2>
              <p className="text-xs text-zinc-400 mt-1">Daftar riwayat transaksi pesanan terkini.</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari transaksi..."
                className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] pl-10 pr-9 py-2 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
                  title="Hapus pencarian"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-[#333] bg-[#1a1a1a] text-zinc-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID Transaksi</th>
                  <th className="px-6 py-4 font-semibold">Waktu</th>
                  <th className="px-6 py-4 font-semibold">Item</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Tidak ada transaksi yang cocok dengan &quot;{searchQuery}&quot;.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-[#2a2a2a] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{trx.id}</td>
                      <td className="px-6 py-4">{trx.time}</td>
                      <td className="px-6 py-4 text-zinc-200">{trx.item}</td>
                      <td className="px-6 py-4 font-bold text-white">Rp {trx.total.toLocaleString("id-ID")}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            trx.status === "Selesai"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {trx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredTransactions.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>
    </Sidebar>
  );
}
