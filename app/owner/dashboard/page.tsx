"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getDashboardData, DashboardTransaction, DashboardStats } from "./actions";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPenjualan: 0,
    totalPenjualanSelesai: 0,
    totalTransaksi: 0,
    totalTrxSelesai: 0,
    totalTrxPending: 0,
    totalTrxPay: 0,
    totalTrxKirim: 0,
    totalTrxCancel: 0,
    totalLabaBersih: 0,
    totalKategori: 0,
    totalGame: 0,
    totalProduk: 0,
    totalSuplier: 0,
  });

  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDashboardData();
      setStats(data.stats);
      setTransactions(data.transactions);
    } catch (err) {
      console.error("Failed memuat data dashboard:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      if (statusFilter !== "ALL" && trx.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const mId = trx.id.toLowerCase().includes(query) || trx.shortId.toLowerCase().includes(query);
        const mItem = trx.item.toLowerCase().includes(query);
        const mStatus = trx.status.toLowerCase().includes(query);
        const mRoblox = trx.username_roblox?.toLowerCase().includes(query);
        const mGame = trx.game_name?.toLowerCase().includes(query);
        const mSuplier = trx.suplier_name?.toLowerCase().includes(query);
        if (!mId && !mItem && !mStatus && !mRoblox && !mGame && !mSuplier) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, searchQuery, statusFilter]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  const getStatusBadge = (statusName: string) => {
    const s = (statusName || "").toLowerCase();
    switch (s) {
      case "selesai":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Selesai
          </span>
        );
      case "bayar":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-3 py-1 text-xs font-bold text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
            Pay
          </span>
        );
      case "kirim":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-400">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
            Kirim
          </span>
        );
      case "batal":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
            Cancel
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FECB2F]/15 border border-[#FECB2F]/30 px-3 py-1 text-xs font-bold text-[#FECB2F]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FECB2F]"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <Sidebar>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard Overview</h1>
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Database Realtime
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Statistik operasional riil dari transaksi database YokPOS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#222222] px-4 py-2.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-[#2a2a2a] transition disabled:opacity-50"
            >
              <i className={`fa-solid fa-arrows-rotate text-xs text-[#FECB2F] ${loading ? "animate-spin" : ""}`}></i>
              Refresh Data
            </button>
            <Link
              href="/owner/transaksi"
              className="flex items-center gap-2 rounded-xl bg-[#FECB2F] px-4 py-2.5 text-xs font-bold text-[#222222] hover:bg-[#e5b62a] transition shadow-[0_0_15px_-3px_#FECB2F]"
            >
              <i className="fa-solid fa-cart-shopping text-sm"></i>
              POS Cashier Baru
            </Link>
          </div>
        </div>

        {/* 4 Main KPI Cards from Real DB */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Omzet */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-lg transition-transform hover:-translate-y-1">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 opacity-20 blur-2xl"></div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Omzet Penjualan</p>
              <i className="fa-solid fa-wallet text-xl text-emerald-400"></i>
            </div>
            <p className="mt-3 text-3xl font-black text-white">
              Rp {stats.totalPenjualan.toLocaleString("id-ID")}
            </p>
            <p className="mt-2 text-xs text-zinc-400 flex justify-between">
              <span>Selesai:</span>
              <strong className="text-emerald-400">
                Rp {stats.totalPenjualanSelesai.toLocaleString("id-ID")}
              </strong>
            </p>
          </div>

          {/* Card 2: Total Transactions */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-lg transition-transform hover:-translate-y-1">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 opacity-20 blur-2xl"></div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Transactions</p>
              <i className="fa-solid fa-receipt text-xl text-blue-400"></i>
            </div>
            <p className="mt-3 text-3xl font-black text-white">
              {stats.totalTransaksi} <span className="text-sm font-normal text-zinc-500">Order</span>
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
              <span className="text-emerald-400 font-semibold">{stats.totalTrxSelesai} Sukses</span>
              <span>•</span>
              <span className="text-[#FECB2F] font-semibold">{stats.totalTrxPending} Pending</span>
            </div>
          </div>

          {/* Card 3: Total Laba Bersih */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-lg transition-transform hover:-translate-y-1">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-[#FECB2F] to-orange-500 opacity-20 blur-2xl"></div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Estimasi Laba Bersih</p>
              <i className="fa-solid fa-chart-line text-xl text-[#FECB2F]"></i>
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-400">
              Rp {stats.totalLabaBersih.toLocaleString("id-ID")}
            </p>
            <p className="mt-2 text-xs text-zinc-500 flex justify-between">
              <span>Profit Rate &amp; Kode:</span>
              <Link href="/owner/report" className="text-[#FECB2F] hover:underline font-semibold">
                Lihat Detail &rarr;
              </Link>
            </p>
          </div>

          {/* Card 4: Master Data Aktif */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-lg transition-transform hover:-translate-y-1">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 blur-2xl"></div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Master Data Sistem</p>
              <i className="fa-solid fa-cubes text-xl text-purple-400"></i>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-[#1a1a1a] p-2 border border-white/5">
                <span className="text-zinc-500 block">Produk:</span>
                <span className="font-bold text-white text-base">{stats.totalProduk}</span>
              </div>
              <div className="rounded-lg bg-[#1a1a1a] p-2 border border-white/5">
                <span className="text-zinc-500 block">Game:</span>
                <span className="font-bold text-white text-base">{stats.totalGame}</span>
              </div>
              <div className="rounded-lg bg-[#1a1a1a] p-2 border border-white/5">
                <span className="text-zinc-500 block">Kategori:</span>
                <span className="font-bold text-white text-base">{stats.totalKategori}</span>
              </div>
              <div className="rounded-lg bg-[#1a1a1a] p-2 border border-white/5">
                <span className="text-zinc-500 block">Suplier:</span>
                <span className="font-bold text-white text-base">{stats.totalSuplier}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Order Status Distribution Bar */}
        <div className="rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📊</span> Distribusi Status Transaksi Riil
            </h3>
            <span className="text-xs text-zinc-400">
              Total {stats.totalTransaksi} data pesanan terdaftar
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div
              onClick={() => setStatusFilter("Selesai")}
              className={`rounded-xl border p-3 cursor-pointer transition ${
                statusFilter === "Selesai"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-white/5 bg-[#1a1a1a] hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>Selesai</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="mt-1 text-xl font-black text-emerald-400">{stats.totalTrxSelesai}</p>
            </div>

            <div
              onClick={() => setStatusFilter("Pay")}
              className={`rounded-xl border p-3 cursor-pointer transition ${
                statusFilter === "Pay"
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-white/5 bg-[#1a1a1a] hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>Pay</span>
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
              </div>
              <p className="mt-1 text-xl font-black text-sky-400">{stats.totalTrxPay}</p>
            </div>

            <div
              onClick={() => setStatusFilter("Kirim")}
              className={`rounded-xl border p-3 cursor-pointer transition ${
                statusFilter === "Kirim"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-white/5 bg-[#1a1a1a] hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>Kirim</span>
                <span className="h-2 w-2 rounded-full bg-purple-400"></span>
              </div>
              <p className="mt-1 text-xl font-black text-purple-400">{stats.totalTrxKirim}</p>
            </div>

            <div
              onClick={() => setStatusFilter("Pending")}
              className={`rounded-xl border p-3 cursor-pointer transition ${
                statusFilter === "Pending"
                  ? "border-[#FECB2F] bg-[#FECB2F]/10"
                  : "border-white/5 bg-[#1a1a1a] hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>Pending</span>
                <span className="h-2 w-2 rounded-full bg-[#FECB2F]"></span>
              </div>
              <p className="mt-1 text-xl font-black text-[#FECB2F]">{stats.totalTrxPending}</p>
            </div>

            <div
              onClick={() => setStatusFilter("Cancel")}
              className={`rounded-xl border p-3 cursor-pointer transition ${
                statusFilter === "Cancel"
                  ? "border-rose-500 bg-rose-500/10"
                  : "border-white/5 bg-[#1a1a1a] hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>Cancel</span>
                <span className="h-2 w-2 rounded-full bg-rose-400"></span>
              </div>
              <p className="mt-1 text-xl font-black text-rose-400">{stats.totalTrxCancel}</p>
            </div>
          </div>

          {statusFilter !== "ALL" && (
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-zinc-400">
                Sedang memfilter status: <strong className="text-white">{statusFilter}</strong>
              </span>
              <button
                onClick={() => setStatusFilter("ALL")}
                className="text-[#FECB2F] hover:underline font-bold"
              >
                Show Semua Status &times;
              </button>
            </div>
          )}
        </div>

        {/* Transaksi Terbaru (Real Data from Database) */}
        <div className="rounded-2xl border border-white/5 bg-[#222222] shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">Transaksi Terbaru</h2>
                <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-zinc-400">
                  {filteredTransactions.length} Data
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Data transaksi riil dari tabel database PostgreSQL.
              </p>
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
                placeholder="Search ID, Roblox, Game, Item..."
                className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] pl-10 pr-9 py-2 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
                  title="Delete pencarian"
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
              <thead className="border-b border-[#333] bg-[#1a1a1a] text-zinc-300 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">ID Transaksi</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">User &amp; Game</th>
                  <th className="px-6 py-4">Item Pesanan</th>
                  <th className="px-6 py-4 text-right">Total Pay</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      Loading data...ansaksi dari database...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      {transactions.length === 0
                        ? "Belum ada transaksi di database. Silakan buat transaksi pertama di menu POS Transaction."
                        : `Tidak ada transaksi yang cocok dengan pencarian "${searchQuery}".`}
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-[#2a2a2a] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white text-xs">
                        {trx.shortId}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="text-white block">{trx.timeFormatted}</span>
                        <span className="text-[11px] text-zinc-500">{trx.dateFormatted}</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-bold text-white block">
                          {trx.username_roblox || "-"}
                        </span>
                        <span className="text-[11px] text-[#FECB2F]">
                          {trx.game_name || "Game Tidak Dispesifikasi"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-300 max-w-xs truncate">
                        {trx.item}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-white block">
                          Rp {trx.total.toLocaleString("id-ID")}
                        </span>
                        {trx.kode_unik > 0 && (
                          <span className="text-[10px] text-[#FECB2F] font-semibold">
                            (+{trx.kode_unik} kode)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(trx.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href="/owner/transaksi"
                          className="text-xs font-bold text-[#FECB2F] hover:underline"
                        >
                          Buka POS &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredTransactions.length > 0 && (
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
