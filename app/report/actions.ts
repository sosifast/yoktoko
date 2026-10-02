"use server";

import { db } from "@/lib/db";

export interface TransactionReportItem {
  id: string;
  create_at: string;
  update_at: string;
  id_kategori: string | null;
  id_game: string | null;
  id_suplier: string | null;
  kategori_name: string | null;
  game_name: string | null;
  suplier_name: string | null;
  username_tiktok: string | null;
  username_roblox: string | null;
  status: string;
  harga: number;
  subtotal: number;
  kode_unik: number;
  rate_robux_suplier: number;
  rate_robux_dijual: number;
  selisih_rate: number;
  margin_rate_percent: number;
  hpp_suplier: number;
  laba_kotor: number;
  laba_bersih: number;
  margin_profit_percent: number;
  data_order: any[];
}

export interface LedgerEntry {
  id: string;
  transaksi_id: string;
  tanggal: string;
  akun: string;
  kode_akun: string;
  keterangan: string;
  debit: number;
  kredit: number;
  saldo_berjalan?: number;
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export async function getFinancialReports(filter: ReportFilter = {}) {
  // 1. Fetch transactions with relations
  const query = `
    SELECT t.*, 
           k.name as kategori_name, 
           g.name as game_name, 
           s.name as suplier_name
    FROM "Transaksi" t
    LEFT JOIN "Kategori" k ON t.id_kategori = k.id
    LEFT JOIN "Game" g ON t.id_game = g.id
    LEFT JOIN "Suplier" s ON t.id_suplier = s.id
    ORDER BY t.create_at DESC
  `;

  const [trxResult, prodResult] = await Promise.all([
    db.query(query),
    db.query('SELECT id, nama_produk, rate_robux_suplier, rate_robux_dijual, harga_jual FROM "Produk"')
  ]);

  const rawTransactions = trxResult.rows;
  const products = prodResult.rows;
  const prodMap = new Map<string, any>();
  products.forEach((p) => {
    prodMap.set(p.nama_produk?.toLowerCase(), p);
    prodMap.set(p.id, p);
  });

  // 2. Filter transactions based on date range and status
  const filtered = rawTransactions.filter((trx) => {
    // Status filter
    const statusVal = (trx.status || "Pending").toLowerCase();
    if (filter.status === "VALID") {
      if (statusVal === "batal") return false;
    } else if (filter.status && filter.status !== "ALL") {
      if (statusVal !== filter.status.toLowerCase()) {
        return false;
      }
    }

    // Date filter (create_at)
    if (filter.startDate) {
      const trxDate = new Date(trx.create_at).toISOString().split("T")[0];
      if (trxDate < filter.startDate) return false;
    }
    if (filter.endDate) {
      const trxDate = new Date(trx.create_at).toISOString().split("T")[0];
      if (trxDate > filter.endDate) return false;
    }

    return true;
  });

  // 3. Process calculations for each transaction
  const items: TransactionReportItem[] = filtered.map((trx) => {
    const subtotal = Number(trx.subtotal) || 0;
    const kode_unik = Number(trx.kode_unik) || 0;
    const harga = Number(trx.harga) || (subtotal + kode_unik);

    let rateSuplier = Number(trx.rate_robux_suplier) || 0;
    let rateJual = Number(trx.rate_robux_dijual) || 0;

    // Fallback if rate is 0, check first item in data_order
    let dataOrder = [];
    try {
      dataOrder = typeof trx.data_order === "string" ? JSON.parse(trx.data_order) : (trx.data_order || []);
    } catch {
      dataOrder = [];
    }

    if ((rateSuplier === 0 || rateJual === 0) && dataOrder.length > 0) {
      const firstItem = dataOrder[0];
      const matchProd = prodMap.get(firstItem?.nama?.toLowerCase());
      if (matchProd) {
        if (rateSuplier === 0) rateSuplier = Number(matchProd.rate_robux_suplier) || 0;
        if (rateJual === 0) rateJual = Number(matchProd.rate_robux_dijual) || 0;
      }
    }

    // Selisih Rate
    const selisih_rate = rateJual > 0 ? (rateJual - rateSuplier) : 0;
    const margin_rate_percent = rateJual > 0 ? (selisih_rate / rateJual) * 100 : 0;

    // HPP / Biaya Pokok Pembelian Suplier
    // Jika rate_robux_dijual > 0: subtotal * (rate_robux_suplier / rate_robux_dijual)
    let hpp_suplier = 0;
    if (rateJual > 0 && rateSuplier > 0) {
      hpp_suplier = subtotal * (rateSuplier / rateJual);
    }

    // Laba Kotor Produk
    const laba_kotor = subtotal - hpp_suplier;

    // Laba Bersih Transaksi (Laba Kotor + Pendapatan Kode Unik)
    const laba_bersih = laba_kotor + kode_unik;

    // Margin Profit Total
    const margin_profit_percent = harga > 0 ? (laba_bersih / harga) * 100 : 0;

    return {
      id: trx.id,
      create_at: trx.create_at,
      update_at: trx.update_at,
      id_kategori: trx.id_kategori,
      id_game: trx.id_game,
      id_suplier: trx.id_suplier,
      kategori_name: trx.kategori_name || "Tanpa Kategori",
      game_name: trx.game_name || "Tanpa Game",
      suplier_name: trx.suplier_name || "Tanpa Suplier",
      username_tiktok: trx.username_tiktok,
      username_roblox: trx.username_roblox,
      status: trx.status,
      harga,
      subtotal,
      kode_unik,
      rate_robux_suplier: rateSuplier,
      rate_robux_dijual: rateJual,
      selisih_rate,
      margin_rate_percent,
      hpp_suplier,
      laba_kotor,
      laba_bersih,
      margin_profit_percent,
      data_order: dataOrder,
    };
  });

  // 4. Hitung Laba Rugi Akumulatif
  const total_pendapatan_kotor = items.reduce((acc, cur) => acc + cur.harga, 0);
  const total_penjualan_produk = items.reduce((acc, cur) => acc + cur.subtotal, 0);
  const total_kode_unik = items.reduce((acc, cur) => acc + cur.kode_unik, 0);
  const total_hpp_suplier = items.reduce((acc, cur) => acc + cur.hpp_suplier, 0);
  const total_laba_kotor = total_penjualan_produk - total_hpp_suplier;
  const total_laba_bersih = total_laba_kotor + total_kode_unik;
  const gross_profit_margin = total_penjualan_produk > 0 ? (total_laba_kotor / total_penjualan_produk) * 100 : 0;
  const net_profit_margin = total_pendapatan_kotor > 0 ? (total_laba_bersih / total_pendapatan_kotor) * 100 : 0;

  // 5. Generate Buku Besar (General Ledger)
  // Menghasilkan entri double-entry accounting per transaksi
  const ledgerEntries: LedgerEntry[] = [];
  let runningCashBalance = 0;

  // Urutkan kronologis dari awal ke akhir untuk saldo berjalan
  const chronologicalItems = [...items].sort(
    (a, b) => new Date(a.create_at).getTime() - new Date(b.create_at).getTime()
  );

  chronologicalItems.forEach((trx) => {
    const formattedDate = new Date(trx.create_at).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    // 1. Kas Masuk (Debit Kas)
    runningCashBalance += trx.harga;
    ledgerEntries.push({
      id: `${trx.id}-kas-masuk`,
      transaksi_id: trx.id,
      tanggal: formattedDate,
      akun: "Kas / Bank (Penerimaan Penjualan)",
      kode_akun: "1101",
      keterangan: `Penerimaan Kas pesanan Roblox ${trx.username_roblox || trx.id.slice(0, 8)}`,
      debit: trx.harga,
      kredit: 0,
      saldo_berjalan: runningCashBalance,
    });

    // 2. Pendapatan Penjualan Produk (Kredit Penjualan)
    ledgerEntries.push({
      id: `${trx.id}-rev-produk`,
      transaksi_id: trx.id,
      tanggal: formattedDate,
      akun: "Pendapatan Penjualan Produk",
      kode_akun: "4101",
      keterangan: `Penjualan ${trx.game_name} - Subtotal Rp ${trx.subtotal.toLocaleString("id-ID")}`,
      debit: 0,
      kredit: trx.subtotal,
    });

    // 3. Pendapatan Lain-lain Kode Unik (Kredit Kode Unik)
    if (trx.kode_unik > 0) {
      ledgerEntries.push({
        id: `${trx.id}-rev-kodeunik`,
        transaksi_id: trx.id,
        tanggal: formattedDate,
        akun: "Pendapatan Lain-lain (Kode Transfer Unik)",
        kode_akun: "4201",
        keterangan: `Kode unik urut konfirmasi pembayaran (+${trx.kode_unik})`,
        debit: 0,
        kredit: trx.kode_unik,
      });
    }

    // 4. Beban Pokok Penjualan Suplier (Debit HPP)
    if (trx.hpp_suplier > 0) {
      ledgerEntries.push({
        id: `${trx.id}-hpp`,
        transaksi_id: trx.id,
        tanggal: formattedDate,
        akun: "Beban Pokok Penjualan (HPP Suplier)",
        kode_akun: "5101",
        keterangan: `Biaya modal ke ${trx.suplier_name} (Rate Suplier: ${trx.rate_robux_suplier} vs Jual: ${trx.rate_robux_dijual})`,
        debit: trx.hpp_suplier,
        kredit: 0,
      });

      // 5. Utang Suplier / Kas Keluar Modal (Kredit Utang Suplier)
      runningCashBalance -= trx.hpp_suplier;
      ledgerEntries.push({
        id: `${trx.id}-suplier-payable`,
        transaksi_id: trx.id,
        tanggal: formattedDate,
        akun: "Kas Keluar Modal / Utang Suplier",
        kode_akun: "2101",
        keterangan: `Kewajiban pembayaran Robux ke ${trx.suplier_name}`,
        debit: 0,
        kredit: trx.hpp_suplier,
        saldo_berjalan: runningCashBalance,
      });
    }
  });

  // 6. Analisis Pendapatan per Suplier
  const suplierAnalysisMap = new Map<string, {
    name: string;
    totalTrx: number;
    totalOmset: number;
    totalHpp: number;
    totalLaba: number;
    avgRateSuplier: number;
    avgRateJual: number;
    sumRateSuplier: number;
    sumRateJual: number;
  }>();

  items.forEach((item) => {
    const key = item.suplier_name || "Tanpa Suplier";
    const existing = suplierAnalysisMap.get(key) || {
      name: key,
      totalTrx: 0,
      totalOmset: 0,
      totalHpp: 0,
      totalLaba: 0,
      avgRateSuplier: 0,
      avgRateJual: 0,
      sumRateSuplier: 0,
      sumRateJual: 0,
    };

    existing.totalTrx += 1;
    existing.totalOmset += item.harga;
    existing.totalHpp += item.hpp_suplier;
    existing.totalLaba += item.laba_bersih;
    existing.sumRateSuplier += item.rate_robux_suplier;
    existing.sumRateJual += item.rate_robux_dijual;
    suplierAnalysisMap.set(key, existing);
  });

  const suplierAnalysis = Array.from(suplierAnalysisMap.values()).map((s) => {
    const avgRateSuplier = s.totalTrx > 0 ? s.sumRateSuplier / s.totalTrx : 0;
    const avgRateJual = s.totalTrx > 0 ? s.sumRateJual / s.totalTrx : 0;
    const selisihRate = avgRateJual - avgRateSuplier;
    const profitMargin = s.totalOmset > 0 ? (s.totalLaba / s.totalOmset) * 100 : 0;

    return {
      suplier_name: s.name,
      total_transaksi: s.totalTrx,
      total_omset: s.totalOmset,
      total_hpp: s.totalHpp,
      total_laba: s.totalLaba,
      avg_rate_suplier: Math.round(avgRateSuplier * 100) / 100,
      avg_rate_jual: Math.round(avgRateJual * 100) / 100,
      selisih_rate: Math.round(selisihRate * 100) / 100,
      profit_margin: Math.round(profitMargin * 100) / 100,
    };
  });

  // 7. Analisis Pendapatan per Game
  const gameAnalysisMap = new Map<string, {
    name: string;
    totalTrx: number;
    totalOmset: number;
    totalHpp: number;
    totalLaba: number;
  }>();

  items.forEach((item) => {
    const key = item.game_name || "Tanpa Game";
    const existing = gameAnalysisMap.get(key) || {
      name: key,
      totalTrx: 0,
      totalOmset: 0,
      totalHpp: 0,
      totalLaba: 0,
    };
    existing.totalTrx += 1;
    existing.totalOmset += item.harga;
    existing.totalHpp += item.hpp_suplier;
    existing.totalLaba += item.laba_bersih;
    gameAnalysisMap.set(key, existing);
  });

  const gameAnalysis = Array.from(gameAnalysisMap.values()).map((g) => ({
    game_name: g.name,
    total_transaksi: g.totalTrx,
    total_omset: g.totalOmset,
    total_hpp: g.totalHpp,
    total_laba: g.totalLaba,
    profit_margin: g.totalOmset > 0 ? Math.round((g.totalLaba / g.totalOmset) * 10000) / 100 : 0,
  }));

  // 8. Tren Pendapatan per Tanggal
  const trendMap = new Map<string, {
    tanggal: string;
    omset: number;
    hpp: number;
    laba: number;
    trx_count: number;
  }>();

  items.forEach((item) => {
    const dateStr = new Date(item.create_at).toISOString().split("T")[0];
    const existing = trendMap.get(dateStr) || {
      tanggal: dateStr,
      omset: 0,
      hpp: 0,
      laba: 0,
      trx_count: 0,
    };
    existing.omset += item.harga;
    existing.hpp += item.hpp_suplier;
    existing.laba += item.laba_bersih;
    existing.trx_count += 1;
    trendMap.set(dateStr, existing);
  });

  const trendData = Array.from(trendMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  return {
    summary: {
      total_transaksi: items.length,
      total_pendapatan_kotor,
      total_penjualan_produk,
      total_kode_unik,
      total_hpp_suplier,
      total_laba_kotor,
      total_laba_bersih,
      gross_profit_margin: Math.round(gross_profit_margin * 100) / 100,
      net_profit_margin: Math.round(net_profit_margin * 100) / 100,
      avg_laba_per_trx: items.length > 0 ? Math.round(total_laba_bersih / items.length) : 0,
    },
    items,
    ledgerEntries,
    suplierAnalysis,
    gameAnalysis,
    trendData,
  };
}
