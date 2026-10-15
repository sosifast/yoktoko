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

export interface DashboardResellerTransaction {
  id: string;
  invoice: string;
  create_at: string;
  timeFormatted: string;
  dateFormatted: string;
  id_user: string;
  user_username: string | null;
  game_name: string | null;
  produk_name: string | null;
  price: number;
  status_pembayaran: string;
  status_transaksi: string;
  kode_server_join: string | null;
  username_roblox: string | null;
}

export interface DashboardMembershipItem {
  id: string;
  create_at: string;
  dateFormatted: string;
  id_user: string;
  username: string | null;
  paket: string;
  durasi: number;
  price: number;
  start_date: string;
  expired_date: string;
  status_pembayaran: string;
  is_active: number;
}

export interface DashboardUserItem {
  id: string;
  username: string;
  email: string | null;
  level: string;
  balance: number;
  create_at: string;
  dateFormatted: string;
  roblox_username: string | null;
  profile_picture_url: string | null;
}

export interface DashboardGameSalesItem {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  pos_trx: number;
  pos_omzet: number;
  reseller_trx: number;
  reseller_omzet: number;
  total_trx: number;
  total_omzet: number;
  percentage_share: number;
}

export interface DashboardStats {
  // Grand Total All Revenue
  totalRevenueAll: number;

  // POS Transaksi
  totalPenjualan: number;
  totalPenjualanSelesai: number;
  totalTransaksi: number;
  totalTrxSelesai: number;
  totalTrxPending: number;
  totalTrxPay: number;
  totalTrxKirim: number;
  totalTrxCancel: number;
  totalLabaBersih: number;

  // Reseller Transaksi
  totalResellerTrx: number;
  totalResellerOmzet: number;
  resellerTrxSuccess: number;
  resellerTrxPending: number;

  // Membership VIP
  totalMembershipSubs: number;
  totalVipActive: number;
  totalVipRevenue: number;

  // User Management
  totalUsers: number;
  totalResellerUsers: number;
  totalOwnerUsers: number;
  totalRobloxLinked: number;

  // Master Data
  totalKategori: number;
  totalGame: number;
  totalProduk: number;
  totalSuplier: number;
}

export async function getDashboardData() {
  const [
    aggResult,
    recentTrxResult,
    resellerAggResult,
    recentResellerTrxResult,
    membershipAggResult,
    recentMembershipResult,
    userAggResult,
    recentUsersResult,
    gameSalesResult,
  ] = await Promise.all([
    // 1. Consolidated POS aggregate & master counts
    db.query(`
      SELECT 
        COUNT(*) as total_transaksi,
        COALESCE(SUM(harga), 0) as total_penjualan,
        COALESCE(SUM(subtotal), 0) as total_subtotal,
        COALESCE(SUM(kode_unik), 0) as total_kode_unik,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'selesai' THEN harga ELSE 0 END), 0) as total_penjualan_selesai,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'selesai' THEN 1 ELSE 0 END), 0) as total_trx_selesai,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'pending' THEN 1 ELSE 0 END), 0) as total_trx_pending,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'pay' THEN 1 ELSE 0 END), 0) as total_trx_bayar,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'kirim' THEN 1 ELSE 0 END), 0) as total_trx_kirim,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'cancel' THEN 1 ELSE 0 END), 0) as total_trx_batal,
        (SELECT COUNT(*) FROM "Kategori") as total_kategori,
        (SELECT COUNT(*) FROM "Game") as total_game,
        (SELECT COUNT(*) FROM "Produk") as total_produk,
        (SELECT COUNT(*) FROM "Suplier") as total_suplier
      FROM "Transaksi"
    `),

    // 2. Recent POS transactions
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
      LIMIT 30
    `),

    // 3. Reseller Transactions Aggregation
    db.query(`
      SELECT 
        COUNT(*) as total_trx,
        COALESCE(SUM(price), 0) as total_omzet,
        COALESCE(SUM(CASE WHEN LOWER(status_pembayaran) IN ('success', 'paid') THEN 1 ELSE 0 END), 0) as total_success,
        COALESCE(SUM(CASE WHEN LOWER(status_pembayaran) = 'pending' THEN 1 ELSE 0 END), 0) as total_pending
      FROM "transaksi_reseller"
    `),

    // 4. Recent Reseller Transactions
    db.query(`
      SELECT 
        tr.*,
        u.username as user_username,
        COALESCE(
          (
            SELECT string_agg(p.nama_produk, ', ')
            FROM "Produk" p
            WHERE p.id::text = ANY(string_to_array(tr.id_produk, ','))
          ),
          'Produk Reseller'
        ) as produk_name,
        g.name as game_name
      FROM "transaksi_reseller" tr
      LEFT JOIN "User" u ON tr.id_user = u.id::text
      LEFT JOIN "Game" g ON tr.id_game = g.id::text
      ORDER BY tr.create_at DESC
      LIMIT 25
    `),

    // 5. Membership VIP Aggregation
    db.query(`
      SELECT 
        COUNT(*) as total_subs,
        COALESCE(SUM(CASE WHEN is_active = 1 AND expired_date > NOW() THEN 1 ELSE 0 END), 0) as total_active,
        COALESCE(SUM(CASE WHEN LOWER(status_pembayaran) IN ('success', 'paid') THEN price ELSE 0 END), 0) as total_revenue
      FROM "history_reseller_plan"
    `),

    // 6. Recent Membership Subscriptions
    db.query(`
      SELECT 
        h.*,
        p.paket,
        p.durasi,
        u.username
      FROM "history_reseller_plan" h
      LEFT JOIN "reseller_plan" p ON h.id_reseller_plan::text = p.id::text
      LEFT JOIN "User" u ON h.id_user::text = u.id::text
      ORDER BY h.create_at DESC
      LIMIT 15
    `),

    // 7. Users Aggregation
    db.query(`
      SELECT 
        COUNT(*) as total_users,
        COALESCE(SUM(CASE WHEN LOWER(level) = 'reseller' THEN 1 ELSE 0 END), 0) as total_reseller,
        COALESCE(SUM(CASE WHEN LOWER(level) = 'owner' THEN 1 ELSE 0 END), 0) as total_owner,
        (SELECT COUNT(*) FROM "user_profile" WHERE roblox_username IS NOT NULL AND roblox_username != '') as total_roblox
      FROM "User"
    `),

    // 8. Recent Users
    db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.level,
        u.balance,
        u.create_at,
        p.roblox_username,
        p.profile_picture_url
      FROM "User" u
      LEFT JOIN "user_profile" p ON p.id_user::text = u.id::text
      ORDER BY u.create_at DESC
      LIMIT 15
    `),

    // 9. Game Sales Aggregation (POS + Reseller Store)
    db.query(`
      SELECT 
        g.id,
        g.name,
        g.slug,
        g.image_url,
        COALESCE(pos.pos_trx, 0)::int as pos_trx,
        COALESCE(pos.pos_omzet, 0)::numeric as pos_omzet,
        COALESCE(res.res_trx, 0)::int as reseller_trx,
        COALESCE(res.res_omzet, 0)::numeric as reseller_omzet,
        (COALESCE(pos.pos_trx, 0) + COALESCE(res.res_trx, 0))::int as total_trx,
        (COALESCE(pos.pos_omzet, 0) + COALESCE(res.res_omzet, 0))::numeric as total_omzet
      FROM "Game" g
      LEFT JOIN (
        SELECT 
          id_game,
          COUNT(id) as pos_trx,
          SUM(harga) as pos_omzet
        FROM "Transaksi"
        WHERE LOWER(status) NOT IN ('batal', 'cancel')
        GROUP BY id_game
      ) pos ON pos.id_game = g.id
      LEFT JOIN (
        SELECT 
          id_game,
          COUNT(id) as res_trx,
          SUM(price) as res_omzet
        FROM "transaksi_reseller"
        WHERE LOWER(status_pembayaran) NOT IN ('cancel', 'batal', 'expired')
        GROUP BY id_game
      ) res ON res.id_game = g.id::text
      ORDER BY total_omzet DESC
    `),
  ]);

  const agg = aggResult.rows[0] || {};
  const resAgg = resellerAggResult.rows[0] || {};
  const memAgg = membershipAggResult.rows[0] || {};
  const usrAgg = userAggResult.rows[0] || {};

  // Process POS transactions and calculate profit
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
    if (statusLower !== "batal" && statusLower !== "cancel") {
      totalLabaBersih += labaBersih;
    }

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
    return {
      id: row.id,
      shortId: `#TRX-${row.id.slice(0, 6).toUpperCase()}`,
      create_at: row.create_at,
      timeFormatted: dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      dateFormatted: dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
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

  // Process Reseller Transactions
  const resellerTransactions: DashboardResellerTransaction[] = recentResellerTrxResult.rows.map((row) => {
    const dateObj = new Date(row.create_at);
    return {
      id: row.id,
      invoice: row.invoice,
      create_at: row.create_at,
      timeFormatted: dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      dateFormatted: dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      id_user: row.id_user,
      user_username: row.user_username,
      game_name: row.game_name,
      produk_name: row.produk_name,
      price: Number(row.price) || 0,
      status_pembayaran: row.status_pembayaran || "Pending",
      status_transaksi: row.status_transaksi || "Pending",
      kode_server_join: row.kode_server_join,
      username_roblox: row.username_roblox,
    };
  });

  // Process Memberships
  const memberships: DashboardMembershipItem[] = recentMembershipResult.rows.map((row) => {
    const dateObj = new Date(row.create_at);
    return {
      id: row.id,
      create_at: row.create_at,
      dateFormatted: dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      id_user: row.id_user,
      username: row.username,
      paket: row.paket || "VIP Plan",
      durasi: Number(row.durasi) || 30,
      price: Number(row.price) || 0,
      start_date: row.start_date,
      expired_date: row.expired_date,
      status_pembayaran: row.status_pembayaran || "Pending",
      is_active: Number(row.is_active) || 0,
    };
  });

  // Process Users
  const users: DashboardUserItem[] = recentUsersResult.rows.map((row) => {
    const dateObj = new Date(row.create_at);
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      level: row.level || "Talent",
      balance: Number(row.balance) || 0,
      create_at: row.create_at,
      dateFormatted: dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      roblox_username: row.roblox_username,
      profile_picture_url: row.profile_picture_url,
    };
  });

  // Process Game Sales and compute percentage share
  const allGameTotalOmzet = gameSalesResult.rows.reduce((acc: number, item: any) => acc + (Number(item.total_omzet) || 0), 0);
  const gameSales: DashboardGameSalesItem[] = gameSalesResult.rows.map((row: any) => {
    const totalOmzet = Number(row.total_omzet) || 0;
    const share = allGameTotalOmzet > 0 ? (totalOmzet / allGameTotalOmzet) * 100 : 0;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      image_url: row.image_url,
      pos_trx: Number(row.pos_trx) || 0,
      pos_omzet: Number(row.pos_omzet) || 0,
      reseller_trx: Number(row.reseller_trx) || 0,
      reseller_omzet: Number(row.reseller_omzet) || 0,
      total_trx: Number(row.total_trx) || 0,
      total_omzet: totalOmzet,
      percentage_share: Math.round(share * 10) / 10,
    };
  });

  const totalPenjualanPOS = Number(agg.total_penjualan) || 0;
  const totalOmzetReseller = Number(resAgg.total_omzet) || 0;
  const totalRevenueVIP = Number(memAgg.total_revenue) || 0;

  const stats: DashboardStats = {
    totalRevenueAll: totalPenjualanPOS + totalOmzetReseller + totalRevenueVIP,

    // POS
    totalPenjualan: totalPenjualanPOS,
    totalPenjualanSelesai: Number(agg.total_penjualan_selesai) || 0,
    totalTransaksi: Number(agg.total_transaksi) || 0,
    totalTrxSelesai: Number(agg.total_trx_selesai) || 0,
    totalTrxPending: Number(agg.total_trx_pending) || 0,
    totalTrxPay: Number(agg.total_trx_bayar) || 0,
    totalTrxKirim: Number(agg.total_trx_kirim) || 0,
    totalTrxCancel: Number(agg.total_trx_batal) || 0,
    totalLabaBersih: Math.round(totalLabaBersih),

    // Reseller
    totalResellerTrx: Number(resAgg.total_trx) || 0,
    totalResellerOmzet: totalOmzetReseller,
    resellerTrxSuccess: Number(resAgg.total_success) || 0,
    resellerTrxPending: Number(resAgg.total_pending) || 0,

    // Membership VIP
    totalMembershipSubs: Number(memAgg.total_subs) || 0,
    totalVipActive: Number(memAgg.total_active) || 0,
    totalVipRevenue: totalRevenueVIP,

    // Users
    totalUsers: Number(usrAgg.total_users) || 0,
    totalResellerUsers: Number(usrAgg.total_reseller) || 0,
    totalOwnerUsers: Number(usrAgg.total_owner) || 0,
    totalRobloxLinked: Number(usrAgg.total_roblox) || 0,

    // Master Catalog
    totalKategori: Number(agg.total_kategori) || 0,
    totalGame: Number(agg.total_game) || 0,
    totalProduk: Number(agg.total_produk) || 0,
    totalSuplier: Number(agg.total_suplier) || 0,
  };

  return {
    stats,
    transactions,
    resellerTransactions,
    memberships,
    users,
    gameSales,
  };
}

/**
 * Sinkronisasi seluruh transaksi membership VIP / Reseller yang berstatus Pending dengan Payment Gateway.
 */
export async function syncAllPendingPayments(): Promise<{
  checked: number;
  updated: number;
  expired: number;
  details: string[];
}> {
  try {
    const pendingResult = await db.query(`
      SELECT h.id, h.bukti_bayar_url, h.price, h.id_user, u.username
      FROM "history_reseller_plan" h
      LEFT JOIN "User" u ON h.id_user::text = u.id::text
      WHERE LOWER(h.status_pembayaran) = 'pending'
      ORDER BY h.create_at DESC
      LIMIT 50
    `);

    const pendingList = pendingResult.rows;
    if (pendingList.length === 0) {
      return { checked: 0, updated: 0, expired: 0, details: ["Tidak ada transaksi pending di database."] };
    }

    const isSandbox = process.env.PGKU_MODE === "SANDBOX";
    const baseUrl = isSandbox ? process.env.PGKU_SANDBOX_URL : process.env.PGKU_PRODUCTION_URL;
    const endpoint = isSandbox ? "sandbox/payment/detail" : "production/payment/detail";

    let updatedCount = 0;
    let expiredCount = 0;
    const details: string[] = [];

    const { markPlanPaymentSuccess } = await import("@/lib/payment-service");

    for (const item of pendingList) {
      const refToCheck = item.bukti_bayar_url || item.id;
      let pgStatus: string | null = null;
      let pgFound = false;

      // Cek status ke Payment Gateway
      try {
        const res = await fetch(`${baseUrl}/${endpoint}?reference=${refToCheck}`, {
          method: "GET",
          headers: {
            api_key: process.env.PGKU_API_KEY!,
            kode_api: process.env.PGKU_KODE_API!,
          },
          cache: "no-store",
        });

        const data = await res.json();
        if (data.success && data.data) {
          pgFound = true;
          pgStatus = data.data.status;
        }
      } catch (err) {
        console.error(`Gagal cek payment ${refToCheck}:`, err);
      }

      const isPaid = pgStatus === "Success" || pgStatus === "PAID" || pgStatus === "SETTLED" || pgStatus === "COMPLETED";

      if (isPaid) {
        // PG bilang PAID → otomatis Success + aktifkan membership
        const success = await markPlanPaymentSuccess(item.id, item.bukti_bayar_url || refToCheck);
        if (success) {
          updatedCount++;
          details.push(`✅ ${item.id.slice(0, 8)} (${item.username || "User"}): LUNAS — otomatis diaktifkan`);
        }
      } else {
        // PG bilang tidak ditemukan ATAU belum bayar → otomatis Expired
        await db.query(
          `UPDATE "history_reseller_plan"
           SET status_pembayaran = 'Expired',
               is_active = 0,
               update_at = NOW()
           WHERE id = $1`,
          [item.id]
        );
        expiredCount++;
        const reason = !pgFound
          ? "tidak terdaftar di Payment Gateway"
          : `status di PG: ${pgStatus}`;
        details.push(`⛔ ${item.id.slice(0, 8)} (${item.username || "User"}): EXPIRED — ${reason}`);
      }
    }

    return {
      checked: pendingList.length,
      updated: updatedCount,
      expired: expiredCount,
      details,
    };
  } catch (error: any) {
    console.error("Gagal sync all pending payments:", error);
    throw new Error(error.message || "Gagal sinkronisasi pembayaran");
  }
}
