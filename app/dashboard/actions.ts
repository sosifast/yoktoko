"use server";

import { db } from "@/lib/db";

export interface DashboardTransaction {
  id: string;
  shortId: string;
  create_at: string;
  timeFormatted: string;
  dateFormatted: string;
  item: string;
  username_roblox: string | null;
  username_tiktok: string | null;
  game_name: string | null;
  kategori_name: string | null;
  suplier_name: string | null;
  total: number;
  subtotal: number;
  kode_unik: number;
  status: string;
  laba_bersih: number;
}

export interface DashboardStats {
  totalPenjualan: number;
  totalPenjualanSelesai: number;
  totalTransaksi: number;
  totalTrxSelesai: number;
  totalTrxPending: number;
  totalTrxBayar: number;
  totalTrxKirim: number;
  totalTrxBatal: number;
  totalLabaBersih: number;
  totalKategori: number;
  totalGame: number;
  totalProduk: number;
  totalSuplier: number;
}

export async function getDashboardData() {
  const [
    trxAggResult,
    countKategori,
    countGame,
    countProduk,
    countSuplier,
    recentTrxResult,
  ] = await Promise.all([
    // Aggregate transactions
    db.query(`
      SELECT 
        COUNT(*) as total_transaksi,
        COALESCE(SUM(harga), 0) as total_penjualan,
        COALESCE(SUM(subtotal), 0) as total_subtotal,
        COALESCE(SUM(kode_unik), 0) as total_kode_unik,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'selesai' THEN harga ELSE 0 END), 0) as total_penjualan_selesai,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'selesai' THEN 1 ELSE 0 END), 0) as total_trx_selesai,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'pending' THEN 1 ELSE 0 END), 0) as total_trx_pending,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'bayar' THEN 1 ELSE 0 END), 0) as total_trx_bayar,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'kirim' THEN 1 ELSE 0 END), 0) as total_trx_kirim,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'batal' THEN 1 ELSE 0 END), 0) as total_trx_batal
      FROM "Transaksi"
    `),
    // Total Kategori
    db.query('SELECT COUNT(*) as count FROM "Kategori"'),
    // Total Game
    db.query('SELECT COUNT(*) as count FROM "Game"'),
    // Total Produk
    db.query('SELECT COUNT(*) as count FROM "Produk"'),
    // Total Suplier
    db.query('SELECT COUNT(*) as count FROM "Suplier"'),
    // Recent transactions with joins
    db.query(`
      SELECT 
        t.id,
        t.create_at,
        t.harga,
        t.subtotal,
        t.kode_unik,
        t.status,
        t.username_roblox,
        t.username_tiktok,
        t.data_order,
        t.rate_robux_suplier,
        t.rate_robux_dijual,
        k.name as kategori_name,
        g.name as game_name,
        s.name as suplier_name
      FROM "Transaksi" t
      LEFT JOIN "Kategori" k ON t.id_kategori = k.id
      LEFT JOIN "Game" g ON t.id_game = g.id
      LEFT JOIN "Suplier" s ON t.id_suplier = s.id
      ORDER BY t.create_at DESC
      LIMIT 100
    `),
  ]);

  const agg = trxAggResult.rows[0];

  // Process recent transactions and calculate profit
  let totalLabaBersih = 0;

  const transactions: DashboardTransaction[] = recentTrxResult.rows.map((row) => {
    const subtotal = Number(row.subtotal) || 0;
    const kodeUnik = Number(row.kode_unik) || 0;
    const harga = Number(row.harga) || (subtotal + kodeUnik);
    const rateSuplier = Number(row.rate_robux_suplier) || 0;
    const rateJual = Number(row.rate_robux_dijual) || 0;

    let hpp = 0;
    if (rateJual > 0 && rateSuplier > 0) {
      hpp = subtotal * (rateSuplier / rateJual);
    }
    const labaKotor = subtotal - hpp;
    const labaBersih = labaKotor + kodeUnik;

    const statusLower = (row.status || "Pending").toLowerCase();
    if (statusLower !== "batal") {
      totalLabaBersih += labaBersih;
    }

    // Format item name
    let itemDescription = "";
    try {
      const items = typeof row.data_order === "string" ? JSON.parse(row.data_order) : (row.data_order || []);
      if (Array.isArray(items) && items.length > 0) {
        itemDescription = items.map((i: any) => `${i.nama || "Item"} x${i.kuantitas || 1}`).join(", ");
      }
    } catch {
      itemDescription = "";
    }

    if (!itemDescription) {
      itemDescription = row.game_name 
        ? `${row.game_name} (${row.kategori_name || "Game Item"})`
        : "Roblox Order";
    }

    const dateObj = new Date(row.create_at);
    const timeFormatted = dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateFormatted = dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return {
      id: row.id,
      shortId: `#TRX-${row.id.slice(0, 6).toUpperCase()}`,
      create_at: row.create_at,
      timeFormatted,
      dateFormatted,
      item: itemDescription,
      username_roblox: row.username_roblox,
      username_tiktok: row.username_tiktok,
      game_name: row.game_name,
      kategori_name: row.kategori_name,
      suplier_name: row.suplier_name,
      total: harga,
      subtotal,
      kode_unik: kodeUnik,
      status: row.status || "Pending",
      laba_bersih: Math.round(labaBersih),
    };
  });

  const stats: DashboardStats = {
    totalPenjualan: Number(agg.total_penjualan) || 0,
    totalPenjualanSelesai: Number(agg.total_penjualan_selesai) || 0,
    totalTransaksi: Number(agg.total_transaksi) || 0,
    totalTrxSelesai: Number(agg.total_trx_selesai) || 0,
    totalTrxPending: Number(agg.total_trx_pending) || 0,
    totalTrxBayar: Number(agg.total_trx_bayar) || 0,
    totalTrxKirim: Number(agg.total_trx_kirim) || 0,
    totalTrxBatal: Number(agg.total_trx_batal) || 0,
    totalLabaBersih: Math.round(totalLabaBersih),
    totalKategori: Number(countKategori.rows[0]?.count) || 0,
    totalGame: Number(countGame.rows[0]?.count) || 0,
    totalProduk: Number(countProduk.rows[0]?.count) || 0,
    totalSuplier: Number(countSuplier.rows[0]?.count) || 0,
  };

  return {
    stats,
    transactions,
  };
}
