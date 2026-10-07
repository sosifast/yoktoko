"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import { useState, useEffect, useMemo } from "react";
import {
  getFinancialReports,
  TransactionReportItem,
  LedgerEntry,
} from "./actions";

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<"pl" | "ledger" | "analysis">("pl");
  const [loading, setLoading] = useState(true);

  // Filters
  const [datePreset, setDatePreset] = useState<"all" | "today" | "7days" | "month" | "year" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Ledger account filter
  const [ledgerAccountFilter, setLedgerAccountFilter] = useState<string>("ALL");
  const [ledgerSearch, setLedgerSearch] = useState<string>("");

  // Data states
  const [reportData, setReportData] = useState<{
    summary: {
      total_transaksi: number;
      total_pendapatan_kotor: number;
      total_penjualan_produk: number;
      total_kode_unik: number;
      total_hpp_suplier: number;
      total_laba_kotor: number;
      total_laba_bersih: number;
      gross_profit_margin: number;
      net_profit_margin: number;
      avg_laba_per_trx: number;
    };
    items: TransactionReportItem[];
    ledgerEntries: LedgerEntry[];
    suplierAnalysis: any[];
    gameAnalysis: any[];
    trendData: any[];
  }>({
    summary: {
      total_transaksi: 0,
      total_pendapatan_kotor: 0,
      total_penjualan_produk: 0,
      total_kode_unik: 0,
      total_hpp_suplier: 0,
      total_laba_kotor: 0,
      total_laba_bersih: 0,
      gross_profit_margin: 0,
      net_profit_margin: 0,
      avg_laba_per_trx: 0,
    },
    items: [],
    ledgerEntries: [],
    suplierAnalysis: [],
    gameAnalysis: [],
    trendData: [],
  });

  // Pagination states
  const [plPage, setPlPage] = useState(1);
  const [plPageSize, setPlPageSize] = useState(10);

  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);

  // Load report data
  const loadData = async (overrideFilter?: { startDate?: string; endDate?: string; status?: string }) => {
    setLoading(true);
    try {
      const filter = {
        startDate: overrideFilter?.startDate !== undefined ? overrideFilter.startDate : startDate,
        endDate: overrideFilter?.endDate !== undefined ? overrideFilter.endDate : endDate,
        status: overrideFilter?.status !== undefined ? overrideFilter.status : statusFilter,
      };
      const res = await getFinancialReports(filter);
      setReportData(res);
      setPlPage(1);
      setLedgerPage(1);
    } catch (err) {
      console.error("Failed memuat laporan keuangan:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Handle Preset Date changes
  const handlePresetChange = (preset: "all" | "today" | "7days" | "month" | "year" | "custom") => {
    setDatePreset(preset);
    const today = new Date();
    let start = "";
    let end = today.toISOString().split("T")[0];

    if (preset === "all") {
      start = "";
      end = "";
    } else if (preset === "today") {
      start = end;
    } else if (preset === "7days") {
      const prev = new Date();
      prev.setDate(today.getDate() - 6);
      start = prev.toISOString().split("T")[0];
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      start = firstDay.toISOString().split("T")[0];
    } else if (preset === "year") {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      start = firstDayOfYear.toISOString().split("T")[0];
    }

    if (preset !== "custom") {
      setStartDate(start);
      setEndDate(end);
      loadData({ startDate: start, endDate: end });
    }
  };

  // Filtered Ledger entries
  const filteredLedgerEntries = useMemo(() => {
    return reportData.ledgerEntries.filter((entry) => {
      if (ledgerAccountFilter !== "ALL" && entry.kode_akun !== ledgerAccountFilter) {
        return false;
      }
      if (ledgerSearch.trim()) {
        const query = ledgerSearch.toLowerCase();
        const mKet = entry.keterangan?.toLowerCase().includes(query);
        const mAkun = entry.akun?.toLowerCase().includes(query);
        const mId = entry.transaksi_id?.toLowerCase().includes(query);
        if (!mKet && !mAkun && !mId) return false;
      }
      return true;
    });
  }, [reportData.ledgerEntries, ledgerAccountFilter, ledgerSearch]);

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === "pl") {
      const headers = [
        "Tanggal",
        "ID Transaksi",
        "Roblox",
        "TikTok",
        "Game",
        "Suplier",
        "Status",
        "Supplier Rate",
        "Selling Rate",
        "Selisih Rate",
        "Omzet Jual (Rp)",
        "HPP Suplier (Rp)",
        "Kode Unik (Rp)",
        "Laba Bersih (Rp)",
        "Margin (%)",
      ];
      const rows = reportData.items.map((i) => [
        new Date(i.create_at).toLocaleDateString("id-ID"),
        i.id,
        i.username_roblox || "-",
        i.username_tiktok || "-",
        i.game_name || "-",
        i.suplier_name || "-",
        i.status,
        i.rate_robux_suplier,
        i.rate_robux_dijual,
        i.selisih_rate,
        i.harga,
        Math.round(i.hpp_suplier),
        i.kode_unik,
        Math.round(i.laba_bersih),
        i.margin_profit_percent.toFixed(2) + "%",
      ]);
      downloadCSV("Laporan_Laba_Rugi_YokPOS.csv", [headers, ...rows]);
    } else if (activeTab === "ledger") {
      const headers = ["Tanggal", "No. Transaksi", "Kode Akun", "Nama Akun", "Keterangan", "Debit (Rp)", "Kredit (Rp)", "Saldo Berjalan"];
      const rows = filteredLedgerEntries.map((e) => [
        e.tanggal,
        e.transaksi_id,
        e.kode_akun,
        e.akun,
        `"${e.keterangan.replace(/"/g, '""')}"`,
        e.debit,
        e.kredit,
        e.saldo_berjalan ?? "-",
      ]);
      downloadCSV("Buku_Besar_YokPOS.csv", [headers, ...rows]);
    } else {
      const headers = ["Supplier Name", "Total Transactions", "Total Omset (Rp)", "Total Modal HPP (Rp)", "Total Laba (Rp)", "Avg Supplier Rate", "Avg Selling Rate", "Selisih Rate", "Margin Profit (%)"];
      const rows = reportData.suplierAnalysis.map((s) => [
        s.suplier_name,
        s.total_transaksi,
        s.total_omset,
        s.total_hpp,
        s.total_laba,
        s.avg_rate_suplier,
        s.avg_rate_jual,
        s.selisih_rate,
        s.profit_margin + "%",
      ]);
      downloadCSV("Analisis_Revenue_Suplier_YokPOS.csv", [headers, ...rows]);
    }
  };

  const downloadCSV = (filename: string, data: any[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," + data.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Sidebar>
      <div className="p-6 md:p-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Financial Report</h1>
              <span className="rounded-lg bg-[#FECB2F]/15 border border-[#FECB2F]/30 px-2.5 py-1 text-xs font-bold text-[#FECB2F]">
                YokPOS Accounting
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Laporan Laba Rugi, Buku Besar umum, dan Analisis Profit Supplier Rate vs Selling Rate.
            </p>
          </div>

          {/* Action Buttons: Export & Print */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#222222] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2c2c2c] transition shadow-md"
            >
              <i className="fa-solid fa-file-csv text-[#FECB2F] text-sm"></i>
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl bg-[#FECB2F] px-4 py-2.5 text-xs font-bold text-[#222222] hover:bg-[#e5b62a] transition shadow-[0_0_15px_-3px_#FECB2F]"
            >
              <i className="fa-solid fa-print text-[#222222] text-sm"></i>
              Cetak / Print
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Date Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 mr-1">Periode:</span>
              {(
                [
                  { id: "all", label: "Semua Waktu" },
                  { id: "today", label: "Hari Ini" },
                  { id: "7days", label: "7 Hari Terakhir" },
                  { id: "month", label: "Bulan Ini" },
                  { id: "year", label: "Tahun Ini" },
                  { id: "custom", label: "Kustom" },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    datePreset === preset.id
                      ? "bg-[#FECB2F] text-[#222222] shadow-[0_0_10px_-2px_#FECB2F]"
                      : "bg-[#1a1a1a] text-zinc-400 hover:text-white border border-white/5"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Status Pesanan:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-[#FECB2F]"
              >
                <option value="ALL">🌐 Semua Status</option>
                <option value="VALID">✨ Valid / Sukses (Selesai, Pay, Kirim)</option>
                <option value="Selesai">✅ Hanya Selesai (Realisasi Laba)</option>
                <option value="Pay">💳 Pay</option>
                <option value="Kirim">🚀 Kirim</option>
                <option value="Pending">⏳ Pending</option>
                <option value="Cancel">❌ Cancel</option>
              </select>
            </div>
          </div>

          {/* Custom Date Picker (when custom is selected) */}
          {datePreset === "custom" && (
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
              <span className="text-xs font-semibold text-zinc-400">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-1.5 text-xs text-white outline-none focus:border-[#FECB2F]"
              />
              <span className="text-xs font-semibold text-zinc-400">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-1.5 text-xs text-white outline-none focus:border-[#FECB2F]"
              />
              <button
                onClick={() => loadData({ startDate, endDate })}
                className="rounded-lg bg-[#FECB2F] px-4 py-1.5 text-xs font-bold text-[#222222] hover:bg-[#e5b62a] transition"
              >
                Terapkan Filter
              </button>
            </div>
          )}
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Omset */}
          <div className="rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Omzet Penjualan</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                💰
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-white">
              Rp {reportData.summary.total_pendapatan_kotor.toLocaleString("id-ID")}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
              <span>{reportData.summary.total_transaksi} Transaksi</span>
              <span className="text-[#FECB2F]">Kode Unik: Rp {reportData.summary.total_kode_unik.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Beban Pokok HPP (Suplier) */}
          <div className="rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Beban Modal HPP (Suplier)</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                🏢
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-red-400">
              Rp {Math.round(reportData.summary.total_hpp_suplier).toLocaleString("id-ID")}
            </p>
            <div className="mt-2 text-xs text-zinc-500">
              Beban pembelian stok Robux ke mitra suplier
            </div>
          </div>

          {/* Laba Bersih */}
          <div className="rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Laba Bersih</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <i className="fa-solid fa-chart-line text-sm"></i>
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-emerald-400">
              Rp {Math.round(reportData.summary.total_laba_bersih).toLocaleString("id-ID")}
            </p>
            <div className="mt-2 text-xs text-zinc-500 flex justify-between">
              <span>Untung Kotor: Rp {Math.round(reportData.summary.total_laba_kotor).toLocaleString("id-ID")}</span>
              <span className="text-emerald-400 font-semibold">Net Profit</span>
            </div>
          </div>

          {/* Margin Profit */}
          <div className="rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Margin Profit Bersih</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FECB2F]/10 text-[#FECB2F] border border-[#FECB2F]/20">
                <i className="fa-solid fa-bolt text-sm"></i>
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-[#FECB2F]">
              {reportData.summary.net_profit_margin}%
            </p>
            <div className="mt-2 text-xs text-zinc-500 flex justify-between">
              <span>Avg Untung / Trx:</span>
              <span className="text-white font-semibold">
                Rp {reportData.summary.avg_laba_per_trx.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab("pl")}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              activeTab === "pl"
                ? "bg-[#FECB2F] text-[#222222] shadow-[0_0_15px_-3px_#FECB2F]"
                : "text-zinc-400 hover:bg-[#222222] hover:text-white"
            }`}
          >
            <i className="fa-solid fa-chart-pie text-sm"></i>
            1. Laba Rugi (P&amp;L)
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              activeTab === "ledger"
                ? "bg-[#FECB2F] text-[#222222] shadow-[0_0_15px_-3px_#FECB2F]"
                : "text-zinc-400 hover:bg-[#222222] hover:text-white"
            }`}
          >
            <i className="fa-solid fa-book text-sm"></i>
            2. Buku Besar (General Ledger)
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              activeTab === "analysis"
                ? "bg-[#FECB2F] text-[#222222] shadow-[0_0_15px_-3px_#FECB2F]"
                : "text-zinc-400 hover:bg-[#222222] hover:text-white"
            }`}
          >
            <i className="fa-solid fa-chart-column text-sm"></i>
            3. Analisis Revenue &amp; Rate
          </button>
        </div>

        {/* TAB 1: LABA RUGI */}
        {activeTab === "pl" && (
          <div className="space-y-8">
            {/* Formal Income Statement Table */}
            <div className="rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-xl space-y-6">
              <div className="border-b border-[#333] pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                    Laporan Laba Rugi Komprehensif
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Standar Akuntansi Pencatatan Bisnis Digital Robux &amp; Game Item
                  </p>
                </div>
                <span className="text-xs font-semibold text-zinc-400">
                  Status: <span className="text-[#FECB2F] font-bold">{statusFilter}</span>
                </span>
              </div>

              <div className="space-y-4 text-sm font-sans">
                {/* 1. Revenue */}
                <div>
                  <div className="flex justify-between items-center py-2 font-bold text-white border-b border-white/5">
                    <span>1. PENDAPATAN OPERASIONAL</span>
                    <span>Rp {reportData.summary.total_pendapatan_kotor.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="pl-4 space-y-1.5 pt-2 text-zinc-400">
                    <div className="flex justify-between items-center text-xs">
                      <span>Penjualan Bersih Produk (Subtotal)</span>
                      <span className="text-white">Rp {reportData.summary.total_penjualan_produk.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>Revenue Kode Transfer Unik (+1 s/d +99)</span>
                      <span className="text-[#FECB2F]">Rp {reportData.summary.total_kode_unik.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Beban Pokok Penjualan (HPP) */}
                <div>
                  <div className="flex justify-between items-center py-2 font-bold text-white border-b border-white/5">
                    <span>2. BEBAN POKOK PENJUALAN (HPP SUPLIER)</span>
                    <span className="text-red-400">
                      (Rp {Math.round(reportData.summary.total_hpp_suplier).toLocaleString("id-ID")})
                    </span>
                  </div>
                  <div className="pl-4 space-y-1.5 pt-2 text-zinc-400">
                    <div className="flex justify-between items-center text-xs">
                      <span>Biaya Pembelian Stok Robux ke Suplier (Berdasarkan Supplier Rate)</span>
                      <span className="text-red-400">
                        (Rp {Math.round(reportData.summary.total_hpp_suplier).toLocaleString("id-ID")})
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Laba Kotor */}
                <div className="flex justify-between items-center py-3 font-extrabold text-white border-y border-white/10 bg-[#1c1c1c] px-4 rounded-xl">
                  <span>LABA KOTOR (GROSS PROFIT)</span>
                  <span className="text-emerald-400 text-base">
                    Rp {Math.round(reportData.summary.total_laba_kotor).toLocaleString("id-ID")}
                  </span>
                </div>

                {/* 4. Revenue Lain-lain & Laba Bersih */}
                <div>
                  <div className="flex justify-between items-center py-2 font-bold text-white border-b border-white/5">
                    <span>3. PENDAPATAN LAIN-LAIN</span>
                    <span className="text-[#FECB2F]">
                      Rp {reportData.summary.total_kode_unik.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="pl-4 space-y-1.5 pt-2 text-zinc-400">
                    <div className="flex justify-between items-center text-xs">
                      <span>Revenue Tambahan Selisih Kode Unik Transfer</span>
                      <span className="text-[#FECB2F]">Rp {reportData.summary.total_kode_unik.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>

                {/* FINAL: Laba Bersih */}
                <div className="flex justify-between items-center p-4 font-black text-white rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div>
                    <span className="text-base text-emerald-400 block uppercase">
                      LABA BERSIH USAHA (NET PROFIT)
                    </span>
                    <span className="text-xs text-zinc-400 font-normal">
                      Margin Profit: {reportData.summary.net_profit_margin}% dari omzet
                    </span>
                  </div>
                  <span className="text-2xl text-emerald-400">
                    Rp {Math.round(reportData.summary.total_laba_bersih).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Rincian Transaksi Laba Rugi */}
            <div className="rounded-2xl border border-white/5 bg-[#222222] shadow-xl overflow-hidden">
              <div className="p-5 border-b border-[#333] flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">Rincian Profit Per Transaksi</h3>
                  <p className="text-xs text-zinc-400">
                    Kalkulasi selisih rate jual vs rate suplier dan keuntungan riil per pesanan
                  </p>
                </div>
                <span className="text-xs text-zinc-400 font-semibold">
                  Total: {reportData.items.length} Data
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="border-b border-[#333] bg-[#1c1c1c] text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                    <tr>
                      <th className="px-6 py-4">Waktu / ID</th>
                      <th className="px-6 py-4">User &amp; Game</th>
                      <th className="px-6 py-4">Mitra Suplier</th>
                      <th className="px-6 py-4">Perbandingan Rate</th>
                      <th className="px-6 py-4 text-right">Omzet Jual</th>
                      <th className="px-6 py-4 text-right">Beban HPP</th>
                      <th className="px-6 py-4 text-right">Kode Unik</th>
                      <th className="px-6 py-4 text-right">Laba Bersih</th>
                      <th className="px-6 py-4 text-center">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-zinc-400">
                          Loading data...poran keuangan...
                        </td>
                      </tr>
                    ) : reportData.items.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                          Belum ada data transaksi pada periode / status yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      reportData.items
                        .slice((plPage - 1) * plPageSize, plPage * plPageSize)
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-6 py-4">
                              <span className="font-bold text-white block text-xs">
                                {new Date(item.create_at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="text-[11px] text-zinc-500 font-mono">
                                #{item.id.slice(0, 8)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-white block text-xs">
                                {item.username_roblox || "-"}
                              </span>
                              <span className="text-[11px] text-zinc-400">
                                {item.game_name} ({item.kategori_name})
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="rounded-lg bg-zinc-800 border border-white/5 px-2 py-1 text-xs font-semibold text-zinc-300">
                                {item.suplier_name}
                              </span>
                            </td>
                            {/* Comparison Rate: Suplier vs Jual */}
                            <td className="px-6 py-4">
                              <div className="space-y-0.5 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-zinc-500 text-[10px]">Beli:</span>
                                  <span className="font-semibold text-red-400">{item.rate_robux_suplier}</span>
                                  <span className="text-zinc-600">&rarr;</span>
                                  <span className="text-zinc-500 text-[10px]">Jual:</span>
                                  <span className="font-semibold text-emerald-400">{item.rate_robux_dijual}</span>
                                </div>
                                <div className="text-[11px] text-[#FECB2F] font-bold">
                                  Untung Rate: +{item.selisih_rate} ({item.margin_rate_percent.toFixed(1)}%)
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-white">
                              Rp {item.harga.toLocaleString("id-ID")}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-red-400">
                              Rp {Math.round(item.hpp_suplier).toLocaleString("id-ID")}
                            </td>
                            <td className="px-6 py-4 text-right text-xs text-[#FECB2F]">
                              {item.kode_unik > 0 ? `+${item.kode_unik}` : "-"}
                            </td>
                            <td className="px-6 py-4 text-right font-black text-emerald-400">
                              Rp {Math.round(item.laba_bersih).toLocaleString("id-ID")}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
                                {item.margin_profit_percent.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && reportData.items.length > 0 && (
                <Pagination
                  currentPage={plPage}
                  totalItems={reportData.items.length}
                  pageSize={plPageSize}
                  onPageChange={setPlPage}
                  onPageSizeChange={setPlPageSize}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BUKU BESAR (GENERAL LEDGER) */}
        {activeTab === "ledger" && (
          <div className="space-y-6">
            {/* Filter Akun Buku Besar */}
            <div className="rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-semibold text-zinc-400">Akun Buku Besar:</span>
                <select
                  value={ledgerAccountFilter}
                  onChange={(e) => {
                    setLedgerAccountFilter(e.target.value);
                    setLedgerPage(1);
                  }}
                  className="rounded-xl border border-white/10 bg-[#1a1a1a] px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-[#FECB2F]"
                >
                  <option value="ALL">Semua Akun (Jurnal Lengkap)</option>
                  <option value="1101">1101 - Kas / Bank (Penerimaan Penjualan)</option>
                  <option value="2101">2101 - Kas Keluar Modal / Utang Suplier</option>
                  <option value="4101">4101 - Revenue Penjualan Produk</option>
                  <option value="4201">4201 - Revenue Lain-lain (Kode Transfer Unik)</option>
                  <option value="5101">5101 - Beban Pokok Penjualan (HPP Suplier)</option>
                </select>
              </div>

              <div className="w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search transaksi / keterangan..."
                  value={ledgerSearch}
                  onChange={(e) => {
                    setLedgerSearch(e.target.value);
                    setLedgerPage(1);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FECB2F]"
                />
              </div>
            </div>

            {/* Table Buku Besar */}
            <div className="rounded-2xl border border-white/5 bg-[#222222] shadow-xl overflow-hidden">
              <div className="p-5 border-b border-[#333] flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">Buku Besar &amp; Jurnal Umum Transaksi</h3>
                  <p className="text-xs text-zinc-400">
                    Pencatatan Debit &amp; Kredit akuntansi berdasarkan transaksi riil
                  </p>
                </div>
                <span className="text-xs text-zinc-400 font-semibold">
                  {filteredLedgerEntries.length} Baris Jurnal
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="border-b border-[#333] bg-[#1c1c1c] text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                    <tr>
                      <th className="px-6 py-4">Tanggal &amp; Waktu</th>
                      <th className="px-6 py-4">Kode &amp; Nama Akun</th>
                      <th className="px-6 py-4">Keterangan / Deskripsi</th>
                      <th className="px-6 py-4 text-right">Debit (Rp)</th>
                      <th className="px-6 py-4 text-right">Kredit (Rp)</th>
                      <th className="px-6 py-4 text-right">Saldo Kas Berjalan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                          Loading data...ku besar...
                        </td>
                      </tr>
                    ) : filteredLedgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                          Tidak ada entri buku besar untuk filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredLedgerEntries
                        .slice((ledgerPage - 1) * ledgerPageSize, ledgerPage * ledgerPageSize)
                        .map((entry) => (
                          <tr key={entry.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
                              {entry.tanggal}
                            </td>
                            <td className="px-6 py-4">
                              <span className="rounded bg-[#1a1a1a] border border-white/10 px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#FECB2F] mr-1.5">
                                {entry.kode_akun}
                              </span>
                              <span className="font-bold text-white text-xs">{entry.akun}</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-zinc-300 max-w-md">
                              {entry.keterangan}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-white">
                              {entry.debit > 0 ? `Rp ${entry.debit.toLocaleString("id-ID")}` : "-"}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-zinc-400">
                              {entry.kredit > 0 ? `Rp ${entry.kredit.toLocaleString("id-ID")}` : "-"}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-emerald-400">
                              {entry.saldo_berjalan !== undefined
                                ? `Rp ${entry.saldo_berjalan.toLocaleString("id-ID")}`
                                : "-"}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && filteredLedgerEntries.length > 0 && (
                <Pagination
                  currentPage={ledgerPage}
                  totalItems={filteredLedgerEntries.length}
                  pageSize={ledgerPageSize}
                  onPageChange={setLedgerPage}
                  onPageSizeChange={setLedgerPageSize}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ANALISIS PENDAPATAN & SPREAD RATE */}
        {activeTab === "analysis" && (
          <div className="space-y-8">
            {/* Rate Spread Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg">
                <span className="text-xs font-bold uppercase text-zinc-400">Formula Hitungan Profit Rate</span>
                <div className="mt-3 space-y-2 text-xs text-zinc-300">
                  <div className="rounded-xl bg-[#1a1a1a] p-3 border border-white/5 font-mono text-[11px]">
                    <p className="text-[#FECB2F] font-bold">Selisih Margin Rate:</p>
                    <p className="mt-1">Rate Dijual - Supplier Rate</p>
                    <p className="mt-2 text-emerald-400 font-bold">Biaya Modal (HPP):</p>
                    <p className="mt-1">Subtotal &times; (Supplier Rate &divide; Selling Rate)</p>
                    <p className="mt-2 text-blue-400 font-bold">Untung Riil:</p>
                    <p className="mt-1">(Subtotal - HPP) + Kode Unik</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg">
                <span className="text-xs font-bold uppercase text-zinc-400">Efisiensi Margin Suplier Rata-Rata</span>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>Margin Profit Penjualan</span>
                    <span className="font-bold text-emerald-400">{reportData.summary.net_profit_margin}%</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-3 overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-[#FECB2F] to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, reportData.summary.net_profit_margin))}%` }}
                    ></div>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    Rata-rata setiap Rp 10.000 omzet menghasilkan laba bersih sebesar{" "}
                    <strong className="text-white">
                      Rp {Math.round((reportData.summary.net_profit_margin / 100) * 10000).toLocaleString("id-ID")}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg">
                <span className="text-xs font-bold uppercase text-zinc-400">Kontribusi Kode Unik</span>
                <div className="mt-4 space-y-2">
                  <p className="text-2xl font-black text-[#FECB2F]">
                    Rp {reportData.summary.total_kode_unik.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Revenue murni 100% margin tanpa potongan modal suplier dari kode pembayaran urut.
                  </p>
                </div>
              </div>
            </div>

            {/* Suplier Performance Breakdown Table */}
            <div className="rounded-2xl border border-white/5 bg-[#222222] shadow-xl overflow-hidden">
              <div className="p-5 border-b border-[#333] flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">Analisis Kinerja Mitra Suplier</h3>
                  <p className="text-xs text-zinc-400">
                    Evaluasi suplier termurah, selisih rate, dan kontribusi laba bersih
                  </p>
                </div>
                <span className="text-xs text-zinc-400 font-semibold">
                  {reportData.suplierAnalysis.length} Suplier Aktif
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="border-b border-[#333] bg-[#1c1c1c] text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                    <tr>
                      <th className="px-6 py-4">Supplier Name</th>
                      <th className="px-6 py-4 text-center">Pesanan</th>
                      <th className="px-6 py-4 text-right">Total Omzet</th>
                      <th className="px-6 py-4 text-right">Modal Suplier (HPP)</th>
                      <th className="px-6 py-4 text-right">Laba Bersih</th>
                      <th className="px-6 py-4 text-center">Avg Rate Beli vs Jual</th>
                      <th className="px-6 py-4 text-center">Selisih Rate</th>
                      <th className="px-6 py-4 text-center">Profit Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {reportData.suplierAnalysis.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                          Belum ada transaksi dengan suplier pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      reportData.suplierAnalysis.map((s, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition">
                          <td className="px-6 py-4 font-bold text-white">
                            {s.suplier_name}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-zinc-300">
                            {s.total_transaksi}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-white">
                            Rp {s.total_omset.toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-red-400">
                            Rp {Math.round(s.total_hpp).toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-emerald-400">
                            Rp {Math.round(s.total_laba).toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-center font-mono text-xs">
                            <span className="text-red-400">{s.avg_rate_suplier}</span>
                            <span className="text-zinc-600 mx-1.5">vs</span>
                            <span className="text-emerald-400">{s.avg_rate_jual}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="rounded bg-[#FECB2F]/15 border border-[#FECB2F]/30 px-2 py-0.5 text-xs font-bold text-[#FECB2F]">
                              +{s.selisih_rate}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
                              {s.profit_margin}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Game Performance Table */}
            <div className="rounded-2xl border border-white/5 bg-[#222222] shadow-xl overflow-hidden">
              <div className="p-5 border-b border-[#333] flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">Analisis Revenue Per Game</h3>
                  <p className="text-xs text-zinc-400">
                    Breakdown volume penjualan dan laba bersih berdasarkan judul game
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="border-b border-[#333] bg-[#1c1c1c] text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                    <tr>
                      <th className="px-6 py-4">Game Name</th>
                      <th className="px-6 py-4 text-center">Jumlah Transaksi</th>
                      <th className="px-6 py-4 text-right">Total Omzet (Rp)</th>
                      <th className="px-6 py-4 text-right">Modal Suplier (HPP)</th>
                      <th className="px-6 py-4 text-right">Laba Bersih</th>
                      <th className="px-6 py-4 text-center">Margin (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {reportData.gameAnalysis.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                          Belum ada transaksi pada game.
                        </td>
                      </tr>
                    ) : (
                      reportData.gameAnalysis.map((g, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition">
                          <td className="px-6 py-4 font-bold text-white">{g.game_name}</td>
                          <td className="px-6 py-4 text-center font-semibold text-zinc-300">
                            {g.total_transaksi}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-white">
                            Rp {g.total_omset.toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-red-400">
                            Rp {Math.round(g.total_hpp).toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-emerald-400">
                            Rp {Math.round(g.total_laba).toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
                              {g.profit_margin}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
