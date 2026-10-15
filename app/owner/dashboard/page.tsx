"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
  getDashboardData,
  syncAllPendingPayments,
  DashboardTransaction,
  DashboardResellerTransaction,
  DashboardMembershipItem,
  DashboardUserItem,
  DashboardGameSalesItem,
  DashboardStats,
} from "./actions";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "game_chart" | "reseller" | "membership" | "user" | "pos">("overview");

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenueAll: 0,
    totalPenjualan: 0,
    totalPenjualanSelesai: 0,
    totalTransaksi: 0,
    totalTrxSelesai: 0,
    totalTrxPending: 0,
    totalTrxPay: 0,
    totalTrxKirim: 0,
    totalTrxCancel: 0,
    totalLabaBersih: 0,
    totalResellerTrx: 0,
    totalResellerOmzet: 0,
    resellerTrxSuccess: 0,
    resellerTrxPending: 0,
    totalMembershipSubs: 0,
    totalVipActive: 0,
    totalVipRevenue: 0,
    totalUsers: 0,
    totalResellerUsers: 0,
    totalOwnerUsers: 0,
    totalRobloxLinked: 0,
    totalKategori: 0,
    totalGame: 0,
    totalProduk: 0,
    totalSuplier: 0,
  });

  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [resellerTransactions, setResellerTransactions] = useState<DashboardResellerTransaction[]>([]);
  const [memberships, setMemberships] = useState<DashboardMembershipItem[]>([]);
  const [users, setUsers] = useState<DashboardUserItem[]>([]);
  const [gameSales, setGameSales] = useState<DashboardGameSalesItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSyncingPayments, setIsSyncingPayments] = useState(false);

  // Search & Filters per Tab
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
      setResellerTransactions(data.resellerTransactions);
      setMemberships(data.memberships);
      setUsers(data.users);
      setGameSales(data.gameSales);
    } catch (err) {
      console.error("Failed memuat data dashboard:", err);
      toast.error("Gagal memuat data dashboard.");
    }
    setLoading(false);
  };

  const handleSyncPayment = async () => {
    setIsSyncingPayments(true);
    const toastId = toast.loading("Memeriksa status pembayaran ke Payment Gateway...");
    try {
      const res = await syncAllPendingPayments();
      if (res.checked === 0) {
        toast.success("Tidak ada transaksi pembayaran pending di database.", { id: toastId });
      } else {
        const msgs: string[] = [];
        if (res.updated > 0) msgs.push(`${res.updated} LUNAS`);
        if (res.expired > 0) msgs.push(`${res.expired} EXPIRED`);
        toast.success(`Selesai! Diperiksa ${res.checked} transaksi: ${msgs.join(", ")}.`, {
          id: toastId,
          duration: 5000,
        });
        await loadData();
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal sinkronisasi pembayaran.", { id: toastId });
    } finally {
      setIsSyncingPayments(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered POS Transactions
  const filteredPosTransactions = useMemo(() => {
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
        if (!mId && !mItem && !mStatus && !mRoblox && !mGame) return false;
      }
      return true;
    });
  }, [transactions, searchQuery, statusFilter]);

  // Filtered Reseller Transactions
  const filteredResellerTransactions = useMemo(() => {
    return resellerTransactions.filter((trx) => {
      if (statusFilter !== "ALL" && trx.status_pembayaran.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mInv = trx.invoice.toLowerCase().includes(q);
        const mUser = trx.user_username?.toLowerCase().includes(q);
        const mGame = trx.game_name?.toLowerCase().includes(q);
        const mProd = trx.produk_name?.toLowerCase().includes(q);
        const mRoblox = trx.username_roblox?.toLowerCase().includes(q);
        if (!mInv && !mUser && !mGame && !mProd && !mRoblox) return false;
      }
      return true;
    });
  }, [resellerTransactions, searchQuery, statusFilter]);

  // Filtered Memberships
  const filteredMemberships = useMemo(() => {
    return memberships.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mUser = m.username?.toLowerCase().includes(q);
        const mPaket = m.paket.toLowerCase().includes(q);
        const mStatus = m.status_pembayaran.toLowerCase().includes(q);
        if (!mUser && !mPaket && !mStatus) return false;
      }
      return true;
    });
  }, [memberships, searchQuery]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mUser = u.username.toLowerCase().includes(q);
        const mEmail = u.email?.toLowerCase().includes(q);
        const mRole = u.level.toLowerCase().includes(q);
        const mRoblox = u.roblox_username?.toLowerCase().includes(q);
        if (!mUser && !mEmail && !mRole && !mRoblox) return false;
      }
      return true;
    });
  }, [users, searchQuery]);

  // Reset pagination on tab change or query change
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("ALL");
  }, [activeTab]);

  const startIndex = (currentPage - 1) * pageSize;

  const paginatedPos = filteredPosTransactions.slice(startIndex, startIndex + pageSize);
  const paginatedReseller = filteredResellerTransactions.slice(startIndex, startIndex + pageSize);
  const paginatedMemberships = filteredMemberships.slice(startIndex, startIndex + pageSize);
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const getStatusBadge = (statusName: string) => {
    const s = (statusName || "").toLowerCase();
    switch (s) {
      case "selesai":
      case "success":
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            {statusName}
          </span>
        );
      case "bayar":
      case "pay":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-xs font-bold text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
            Pay
          </span>
        );
      case "kirim":
      case "proses":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-xs font-bold text-purple-400">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
            {statusName}
          </span>
        );
      case "batal":
      case "cancel":
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-xs font-bold text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
            {statusName}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FECB2F]/15 border border-[#FECB2F]/30 px-2.5 py-0.5 text-xs font-bold text-[#FECB2F]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FECB2F]"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <Sidebar>
      <Toaster position="top-right" />
      <div className="p-4 sm:p-6 md:p-8 space-y-8 animate-fade-in text-zinc-100">
        
        {/* HEADER & TOP CONTROLS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                <i className="fa-solid fa-chart-pie text-[#FECB2F]"></i>
                Dashboard Executive
              </h1>
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Database Realtime
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Pusat kendali &amp; performa penjualan game, reseller, membership VIP, dan database pengguna.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSyncPayment}
              disabled={isSyncingPayments || loading}
              className="flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3.5 py-2 text-xs font-bold text-sky-400 hover:bg-sky-500/20 transition disabled:opacity-50 shadow-sm"
              title="Periksa transaksi pending ke Payment Gateway"
            >
              <i className={`fa-solid fa-credit-card ${isSyncingPayments ? "animate-pulse" : ""}`}></i>
              <span>{isSyncingPayments ? "Checking..." : "Sync PG Payment"}</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/90 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-700 transition disabled:opacity-50"
            >
              <i className={`fa-solid fa-arrows-rotate text-[#FECB2F] ${loading ? "animate-spin" : ""}`}></i>
              <span>Refresh</span>
            </button>

            <Link
              href="/owner/transaksi"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-[#FECB2F] hover:from-amber-300 hover:to-yellow-400 text-zinc-950 px-4 py-2 text-xs font-extrabold shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <i className="fa-solid fa-cart-shopping"></i>
              <span>POS Kasir Baru</span>
            </Link>
          </div>
        </div>

        {/* 4 PRIMARY EXECUTIVE KPI CARDS */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* CARD 1: TOTAL REVENUE GABUNGAN */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950 p-5 sm:p-6 shadow-xl group hover:border-[#FECB2F]/40 transition-all">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Omzet Bisnis</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <i className="fa-solid fa-wallet text-base"></i>
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-black text-white">
              Rp {stats.totalRevenueAll.toLocaleString("id-ID")}
            </p>
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-col gap-1 text-[11px] text-zinc-400">
              <div className="flex justify-between">
                <span>Kasir POS:</span>
                <span className="text-zinc-200 font-semibold">Rp {stats.totalPenjualan.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Toko Reseller:</span>
                <span className="text-zinc-200 font-semibold">Rp {stats.totalResellerOmzet.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>VIP Subs:</span>
                <span className="text-[#FECB2F] font-bold">Rp {stats.totalVipRevenue.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* CARD 2: RESELLER TRANSAKSI STATS */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950 p-5 sm:p-6 shadow-xl group hover:border-sky-500/40 transition-all">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-500/20 blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Toko Game Reseller</span>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <i className="fa-solid fa-store text-base"></i>
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-black text-sky-400">
              {stats.totalResellerTrx} <span className="text-xs font-normal text-zinc-400">Pesanan</span>
            </p>
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <span className="text-emerald-400 font-semibold">{stats.resellerTrxSuccess} Lunas</span>
              <span>•</span>
              <span className="text-[#FECB2F] font-semibold">{stats.resellerTrxPending} Pending</span>
              <span>•</span>
              <Link href="/owner/trx-seller" className="text-sky-400 hover:underline font-bold text-[11px]">
                Detail &rarr;
              </Link>
            </div>
          </div>

          {/* CARD 3: MEMBERSHIP VIP STATS */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950 p-5 sm:p-6 shadow-xl group hover:border-[#FECB2F]/40 transition-all">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/20 blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Membership VIP Aktif</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#FECB2F]">
                <i className="fa-solid fa-crown text-base"></i>
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-black text-[#FECB2F]">
              {stats.totalVipActive} <span className="text-xs font-normal text-zinc-400">VIP Member</span>
            </p>
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex justify-between items-center text-xs text-zinc-400">
              <span>Total {stats.totalMembershipSubs} Pendaftar</span>
              <Link href="/owner/plan-reseller/history" className="text-[#FECB2F] hover:underline font-bold text-[11px]">
                Kelola VIP &rarr;
              </Link>
            </div>
          </div>

          {/* CARD 4: USER & PELANGGAN */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950 p-5 sm:p-6 shadow-xl group hover:border-purple-500/40 transition-all">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pengguna Terdaftar</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <i className="fa-solid fa-users text-base"></i>
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-black text-purple-400">
              {stats.totalUsers} <span className="text-xs font-normal text-zinc-400">Akun</span>
            </p>
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex justify-between items-center text-[11px] text-zinc-400">
              <span>{stats.totalResellerUsers} Reseller • {stats.totalRobloxLinked} Roblox</span>
              <Link href="/owner/user" className="text-purple-400 hover:underline font-bold">
                Users &rarr;
              </Link>
            </div>
          </div>

        </div>

        {/* GRAFIK PENJUALAN PER GAME SECTION (FEATURED) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <i className="fa-solid fa-chart-simple text-[#FECB2F]"></i>
                Grafik &amp; Analisis Penjualan per Game
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Performa pendapatan riil dari akumulasi Kasir POS dan Pembelian Toko Reseller.
              </p>
            </div>

            <span className="text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-xl border border-zinc-700 font-semibold self-start sm:self-auto">
              Total {gameSales.length} Game Terdaftar
            </span>
          </div>

          {gameSales.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {gameSales.map((game, index) => {
                const rankBadge =
                  index === 0 ? "🥇 Juara 1" : index === 1 ? "🥈 Posisi 2" : index === 2 ? "🥉 Posisi 3" : `#${index + 1}`;

                return (
                  <div
                    key={game.id}
                    className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-[#FECB2F]/50 transition-all flex flex-col justify-between gap-3 shadow-md group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Game Icon / Image */}
                        <div className="w-12 h-12 rounded-xl bg-zinc-850 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0 relative group-hover:scale-105 transition-transform">
                          {game.image_url ? (
                            <img src={game.image_url} alt={game.name} className="w-full h-full object-cover" />
                          ) : (
                            <i className="fa-solid fa-gamepad text-[#FECB2F] text-xl"></i>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-black text-white group-hover:text-[#FECB2F] transition-colors">
                              {game.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FECB2F]/15 text-[#FECB2F] border border-[#FECB2F]/30">
                              {rankBadge}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-400 font-medium">
                            {game.total_trx} Total Transaksi
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-zinc-400 block font-medium">Total Omzet</span>
                        <span className="text-base sm:text-lg font-black text-emerald-400">
                          Rp {game.total_omzet.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar / Share of Total Sales */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Pangsa Pasar Penjualan</span>
                        <span className="font-bold text-zinc-200">{game.percentage_share}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-750">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 via-[#FECB2F] to-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(254,203,47,0.5)]"
                          style={{ width: `${Math.max(game.percentage_share, 4)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Detailed POS vs Reseller breakdown */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-850 text-xs">
                      <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 flex flex-col">
                        <span className="text-[10px] text-zinc-400">Kasir POS ({game.pos_trx} Trx)</span>
                        <span className="font-bold text-white text-xs mt-0.5">
                          Rp {game.pos_omzet.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 flex flex-col">
                        <span className="text-[10px] text-zinc-400">Toko Reseller ({game.reseller_trx} Trx)</span>
                        <span className="font-bold text-sky-400 text-xs mt-0.5">
                          Rp {game.reseller_omzet.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
              Belum ada data game di database.
            </div>
          )}
        </div>

        {/* INTERACTIVE NAVIGATION TABS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-zinc-800 pb-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "overview"
                  ? "bg-[#FECB2F] text-zinc-950 shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <i className="fa-solid fa-list-check"></i>
              <span>Ringkasan Eksekutif</span>
            </button>

            <button
              onClick={() => setActiveTab("reseller")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "reseller"
                  ? "bg-[#FECB2F] text-zinc-950 shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <i className="fa-solid fa-shop"></i>
              <span>Transaksi Reseller ({resellerTransactions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("membership")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "membership"
                  ? "bg-[#FECB2F] text-zinc-950 shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <i className="fa-solid fa-crown text-amber-400"></i>
              <span>Membership VIP ({memberships.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("user")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "user"
                  ? "bg-[#FECB2F] text-zinc-950 shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <i className="fa-solid fa-users"></i>
              <span>Data User ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("pos")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "pos"
                  ? "bg-[#FECB2F] text-zinc-950 shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <i className="fa-solid fa-receipt"></i>
              <span>Kasir POS ({transactions.length})</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW COMPREHENSIVE */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Quick Summary Reseller Box */}
              <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <i className="fa-solid fa-store text-sky-400"></i>
                    Transaksi Reseller Terkini
                  </h3>
                  <Link href="/owner/trx-seller" className="text-xs text-[#FECB2F] hover:underline font-bold">
                    Kelola &rarr;
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {resellerTransactions.slice(0, 4).map((trx) => (
                    <div key={trx.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-zinc-200">{trx.invoice}</span>
                        <span className="text-[10px] text-zinc-400">{trx.user_username || "User"} • {trx.game_name || "Game"}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-white block">Rp {trx.price.toLocaleString("id-ID")}</span>
                        {getStatusBadge(trx.status_pembayaran)}
                      </div>
                    </div>
                  ))}
                  {resellerTransactions.length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-4">Belum ada transaksi reseller.</p>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab("reseller")}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-bold text-zinc-200"
                >
                  Buka Tab Transaksi Reseller
                </button>
              </div>

              {/* Quick Summary VIP Memberships */}
              <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <i className="fa-solid fa-crown text-[#FECB2F]"></i>
                    Pendaftaran VIP Terbaru
                  </h3>
                  <Link href="/owner/plan-reseller/history" className="text-xs text-[#FECB2F] hover:underline font-bold">
                    Semua VIP &rarr;
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {memberships.slice(0, 4).map((m) => (
                    <div key={m.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-200">{m.username || "User"}</span>
                        <span className="text-[10px] text-[#FECB2F] font-semibold">{m.paket} ({m.durasi} Hari)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white block">Rp {m.price.toLocaleString("id-ID")}</span>
                        <span className={`text-[10px] font-bold ${m.is_active === 1 ? "text-emerald-400" : "text-zinc-500"}`}>
                          {m.is_active === 1 ? "Aktif" : "Non-Aktif"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {memberships.length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-4">Belum ada riwayat VIP.</p>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab("membership")}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-bold text-zinc-200"
                >
                  Buka Tab Membership VIP
                </button>
              </div>

              {/* Quick Summary Registered Users */}
              <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <i className="fa-solid fa-users text-purple-400"></i>
                    User Baru Terdaftar
                  </h3>
                  <Link href="/owner/user" className="text-xs text-[#FECB2F] hover:underline font-bold">
                    Kelola User &rarr;
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {users.slice(0, 4).map((u) => (
                    <div key={u.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {u.profile_picture_url ? (
                            <img src={u.profile_picture_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <i className="fa-solid fa-user text-[11px] text-[#FECB2F]"></i>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{u.username}</span>
                          <span className="text-[10px] text-zinc-400">{u.level}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block">{u.dateFormatted}</span>
                        {u.roblox_username ? (
                          <span className="text-[10px] text-red-400 font-semibold">{u.roblox_username}</span>
                        ) : (
                          <span className="text-[10px] text-zinc-600">No Roblox</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab("user")}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-bold text-zinc-200"
                >
                  Buka Tab Semua User
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: TRANSAKSI RESELLER */}
          {activeTab === "reseller" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <i className="fa-solid fa-store text-sky-400"></i>
                    Daftar Transaksi Toko Reseller
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Pesanan produk game dari reseller via web store ({filteredResellerTransactions.length} data)
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Cari Invoice, User, Game..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FECB2F]"
                    />
                  </div>
                  <Link
                    href="/owner/trx-seller"
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 text-xs font-bold hover:bg-sky-500/30 whitespace-nowrap"
                  >
                    Buka Halaman Trx Reseller &rarr;
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3.5">Invoice</th>
                      <th className="px-5 py-3.5">Waktu</th>
                      <th className="px-5 py-3.5">Reseller</th>
                      <th className="px-5 py-3.5">Game &amp; Produk</th>
                      <th className="px-5 py-3.5 text-right">Harga</th>
                      <th className="px-5 py-3.5 text-center">Status Bayar</th>
                      <th className="px-5 py-3.5 text-center">Status Pesanan</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {paginatedReseller.length > 0 ? (
                      paginatedReseller.map((trx) => (
                        <tr key={trx.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-white">{trx.invoice}</td>
                          <td className="px-5 py-3.5 text-zinc-400">{trx.dateFormatted} {trx.timeFormatted}</td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-white block">{trx.user_username || "User"}</span>
                            {trx.username_roblox && (
                              <span className="text-[10px] text-red-400 font-semibold">{trx.username_roblox}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-white font-semibold block">{trx.game_name || "Game"}</span>
                            <span className="text-[10px] text-zinc-400 truncate max-w-xs block">{trx.produk_name || "-"}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-black text-[#FECB2F]">
                            Rp {trx.price.toLocaleString("id-ID")}
                          </td>
                          <td className="px-5 py-3.5 text-center">{getStatusBadge(trx.status_pembayaran)}</td>
                          <td className="px-5 py-3.5 text-center">{getStatusBadge(trx.status_transaksi)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <Link href="/owner/trx-seller" className="text-[#FECB2F] hover:underline font-bold">
                              Proses &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-zinc-500">
                          Tidak ada data transaksi reseller.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredResellerTransactions.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredResellerTransactions.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 3: MEMBERSHIP VIP */}
          {activeTab === "membership" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <i className="fa-solid fa-crown text-[#FECB2F]"></i>
                    Data Langganan Membership VIP
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Riwayat pembelian paket reseller VIP ({filteredMemberships.length} data)
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="Cari Username, Paket..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FECB2F]"
                  />
                  <Link
                    href="/owner/plan-reseller/history"
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-[#FECB2F] border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 whitespace-nowrap"
                  >
                    Buka Menu Plan &rarr;
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Paket VIP</th>
                      <th className="px-5 py-3.5">Durasi</th>
                      <th className="px-5 py-3.5 text-right">Harga</th>
                      <th className="px-5 py-3.5">Tanggal Order</th>
                      <th className="px-5 py-3.5 text-center">Status Bayar</th>
                      <th className="px-5 py-3.5 text-center">Status Member</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {paginatedMemberships.length > 0 ? (
                      paginatedMemberships.map((m) => (
                        <tr key={m.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-white">{m.username || "User"}</td>
                          <td className="px-5 py-3.5 font-bold text-[#FECB2F]">{m.paket}</td>
                          <td className="px-5 py-3.5 text-zinc-400">{m.durasi} Hari</td>
                          <td className="px-5 py-3.5 text-right font-black text-white">Rp {m.price.toLocaleString("id-ID")}</td>
                          <td className="px-5 py-3.5 text-zinc-400">{m.dateFormatted}</td>
                          <td className="px-5 py-3.5 text-center">{getStatusBadge(m.status_pembayaran)}</td>
                          <td className="px-5 py-3.5 text-center">
                            {m.is_active === 1 ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                Aktif
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-bold border border-zinc-700">
                                Non-Aktif
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          Tidak ada data membership VIP.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredMemberships.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredMemberships.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 4: DATA USER */}
          {activeTab === "user" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <i className="fa-solid fa-users text-purple-400"></i>
                    Database Pengguna &amp; Reseller
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Daftar akun terdaftar di sistem ({filteredUsers.length} akun)
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="Cari Username, Email, Role..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FECB2F]"
                  />
                  <Link
                    href="/owner/user"
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 text-xs font-bold hover:bg-purple-500/30 whitespace-nowrap"
                  >
                    Manajemen User &rarr;
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5 text-center">Level / Role</th>
                      <th className="px-5 py-3.5">Akun Roblox</th>
                      <th className="px-5 py-3.5 text-right">Saldo / Balance</th>
                      <th className="px-5 py-3.5 text-right">Terdaftar</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {paginatedUsers.length > 0 ? (
                      paginatedUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                              {u.profile_picture_url ? (
                                <img src={u.profile_picture_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <i className="fa-solid fa-user text-[10px] text-[#FECB2F]"></i>
                              )}
                            </div>
                            <span>{u.username}</span>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-400">{u.email || "-"}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                u.level.toLowerCase() === "owner"
                                  ? "bg-amber-500/20 text-[#FECB2F] border border-amber-500/40"
                                  : u.level.toLowerCase() === "reseller"
                                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}
                            >
                              {u.level}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {u.roblox_username ? (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <i className="fa-solid fa-cube text-[10px]"></i>
                                {u.roblox_username}
                              </span>
                            ) : (
                              <span className="text-zinc-500">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-white">
                            Rp {u.balance.toLocaleString("id-ID")}
                          </td>
                          <td className="px-5 py-3.5 text-right text-zinc-400">{u.dateFormatted}</td>
                          <td className="px-5 py-3.5 text-right">
                            <Link href="/owner/user" className="text-[#FECB2F] hover:underline font-bold">
                              Edit &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          Tidak ada data user yang sesuai.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredUsers.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 5: KASIR POS TRANSAKSI */}
          {activeTab === "pos" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <i className="fa-solid fa-receipt text-[#FECB2F]"></i>
                    Riwayat Transaksi Kasir POS
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Data transaksi riil dari modul kasir POS ({filteredPosTransactions.length} data)
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="Cari ID, Roblox, Game..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FECB2F]"
                  />
                  <Link
                    href="/owner/transaksi"
                    className="px-3 py-1.5 rounded-xl bg-[#FECB2F] text-zinc-950 text-xs font-black hover:bg-yellow-400 whitespace-nowrap"
                  >
                    POS Baru &rarr;
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3.5">ID Transaksi</th>
                      <th className="px-5 py-3.5">Waktu</th>
                      <th className="px-5 py-3.5">User &amp; Game</th>
                      <th className="px-5 py-3.5">Item Pesanan</th>
                      <th className="px-5 py-3.5 text-right">Total Bayar</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {paginatedPos.length > 0 ? (
                      paginatedPos.map((trx) => (
                        <tr key={trx.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-white">{trx.shortId}</td>
                          <td className="px-5 py-3.5 text-zinc-400">{trx.dateFormatted} {trx.timeFormatted}</td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-white block">{trx.username_roblox || "-"}</span>
                            <span className="text-[10px] text-[#FECB2F]">{trx.game_name || "Game"}</span>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-300 max-w-xs truncate">{trx.item}</td>
                          <td className="px-5 py-3.5 text-right font-black text-white">
                            Rp {trx.total.toLocaleString("id-ID")}
                          </td>
                          <td className="px-5 py-3.5 text-center">{getStatusBadge(trx.status)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <Link href="/owner/transaksi" className="text-[#FECB2F] hover:underline font-bold">
                              Buka &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          Tidak ada data transaksi kasir POS.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredPosTransactions.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredPosTransactions.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>
          )}

        </div>

      </div>
    </Sidebar>
  );
}
