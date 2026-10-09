"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { triggerPusherEvent } from "@/lib/pusher-server";

export async function getDropdownDataForTransaksi() {
  const [categories, games, supliers, products] = await Promise.all([
    db.query('SELECT id, name FROM "Kategori" ORDER BY name ASC'),
    db.query('SELECT id, name FROM "Game" ORDER BY name ASC'),
    db.query('SELECT id, name FROM "Suplier" ORDER BY name ASC'),
    db.query('SELECT * FROM "Produk" ORDER BY nama_produk ASC'),
  ]);

  return {
    categories: categories.rows,
    games: games.rows,
    supliers: supliers.rows,
    products: products.rows,
  };
}

export async function getTransaksi(limit = 200) {
  const result = await db.query(`
    SELECT t.id, t.create_at, t.update_at, t.id_kategori, t.id_game, t.id_suplier,
           t.username_tiktok, t.username_roblox, t.harga, t.subtotal, t.kode_unik,
           t.rate_robux_suplier, t.rate_robux_dijual, t.status, t.data_order, t.diskon,
           k.name as kategori_name, 
           g.name as game_name, 
           s.name as suplier_name
    FROM "Transaksi" t
    LEFT JOIN "Kategori" k ON t.id_kategori = k.id
    LEFT JOIN "Game" g ON t.id_game = g.id
    LEFT JOIN "Suplier" s ON t.id_suplier = s.id
    ORDER BY t.create_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

/**
 * Generate sequential unique code (1-99) for a specific subtotal/base price.
 * Example:
 * Base price 5000:
 * 1st -> 1 (5001)
 * 2nd -> 2 (5002)
 * Base price 8000:
 * 1st -> 1 (8001)
 */
export async function getNextKodeUnik(subtotal: number): Promise<number> {
  // Query the latest transaction with the exact same base price
  const latest = await db.query(
    `
    SELECT kode_unik FROM "Transaksi" 
    WHERE (subtotal = $1 OR (harga - COALESCE(kode_unik, 0)) = $1)
    ORDER BY create_at DESC 
    LIMIT 1
  `,
    [subtotal]
  );

  if (latest.rows.length === 0) {
    return 1;
  }

  const lastCode = Number(latest.rows[0].kode_unik) || 0;
  let nextCode = (lastCode % 99) + 1;

  // Check currently active / pending codes for the same price to avoid collision
  const activeCodesResult = await db.query(
    `
    SELECT kode_unik FROM "Transaksi"
    WHERE (subtotal = $1 OR (harga - COALESCE(kode_unik, 0)) = $1)
      AND status IN ('Pending', 'Pay')
  `,
    [subtotal]
  );
  const activeCodes = new Set(activeCodesResult.rows.map((r) => Number(r.kode_unik)));

  if (activeCodes.has(nextCode)) {
    for (let i = 1; i <= 99; i++) {
      const candidate = ((lastCode + i - 1) % 99) + 1;
      if (!activeCodes.has(candidate)) {
        nextCode = candidate;
        break;
      }
    }
  }

  return nextCode;
}

export interface CreateTransaksiInput {
  id_kategori: string | null;
  id_game: string | null;
  id_suplier: string | null;
  username_tiktok: string;
  username_roblox: string;
  subtotal: number;
  harga: number;
  rate_robux_suplier: number;
  rate_robux_dijual: number;
  data_order: { nama: string; kuantitas: number; harga?: number; subtotal?: number }[];
  status?: string;
  kode_unik?: number;
  diskon?: number;
}

export async function createTransaksi(data: CreateTransaksiInput) {
  const status = data.status || "Pending";
  // If kode_unik not passed or 0, generate next sequential code for this subtotal
  const kodeUnik = data.kode_unik && data.kode_unik > 0 
    ? data.kode_unik 
    : await getNextKodeUnik(data.subtotal);
  
  // Ensure final price includes subtotal + kodeUnik
  const finalHarga = data.subtotal + kodeUnik;

  const result = await db.query(
    `
    INSERT INTO "Transaksi" (
      id_kategori, id_game, id_suplier, 
      username_tiktok, username_roblox, 
      harga, subtotal, rate_robux_suplier, rate_robux_dijual, 
      data_order, status, kode_unik, diskon
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `,
    [
      data.id_kategori || null,
      data.id_game || null,
      data.id_suplier || null,
      data.username_tiktok,
      data.username_roblox,
      finalHarga,
      data.subtotal,
      data.rate_robux_suplier,
      data.rate_robux_dijual,
      JSON.stringify(data.data_order),
      status,
      kodeUnik,
      data.diskon || 0,
    ]
  );

  const newId = result.rows[0]?.id;

  // Broadcast to Pusher
  try {
    const fullTrx = await db.query(`
      SELECT t.*, 
             k.name as kategori_name, 
             g.name as game_name, 
             s.name as suplier_name
      FROM "Transaksi" t
      LEFT JOIN "Kategori" k ON t.id_kategori = k.id
      LEFT JOIN "Game" g ON t.id_game = g.id
      LEFT JOIN "Suplier" s ON t.id_suplier = s.id
      WHERE t.id = $1
    `, [newId]);
    if (fullTrx.rows.length > 0) {
      await triggerPusherEvent("transactions-queue", "transaction-created", fullTrx.rows[0]);
    }
  } catch (err) {
    console.warn("Pusher broadcast error on create:", err);
  }

  revalidatePath("/transaksi");
  revalidatePath("/monitor");
  return result.rows[0];
}

export async function updateStatusTransaksi(id: string, status: string) {
  const current = await db.query('SELECT status FROM "Transaksi" WHERE id = $1', [id]);
  if (current.rows.length > 0) {
    const curStatus = (current.rows[0].status || "").toLowerCase();
    if (curStatus === "selesai" || curStatus === "cancel" || curStatus === "batal") {
      throw new Error(`Transaksi sudah berstatus "${current.rows[0].status}" dan tidak dapat diubah lagi.`);
    }
  }

  await db.query(
    'UPDATE "Transaksi" SET status = $1, update_at = CURRENT_TIMESTAMP WHERE id = $2',
    [status, id]
  );

  // Broadcast to Pusher
  try {
    const updatedTrx = await db.query(`
      SELECT t.*, 
             k.name as kategori_name, 
             g.name as game_name, 
             s.name as suplier_name
      FROM "Transaksi" t
      LEFT JOIN "Kategori" k ON t.id_kategori = k.id
      LEFT JOIN "Game" g ON t.id_game = g.id
      LEFT JOIN "Suplier" s ON t.id_suplier = s.id
      WHERE t.id = $1
    `, [id]);
    if (updatedTrx.rows.length > 0) {
      await triggerPusherEvent("transactions-queue", "transaction-updated", updatedTrx.rows[0]);
    }
  } catch (err) {
    console.warn("Pusher broadcast error on update:", err);
  }

  revalidatePath("/transaksi");
  revalidatePath("/monitor");
}

export async function updateTransaksiInfo(id: string, data: { username_roblox: string; id_suplier: string | null; status: string; rate_robux_suplier: number; rate_robux_dijual: number; harga?: number }) {
  const current = await db.query('SELECT status FROM "Transaksi" WHERE id = $1', [id]);
  if (current.rows.length > 0) {
    const curStatus = (current.rows[0].status || "").toLowerCase();
    if (curStatus === "selesai" || curStatus === "cancel" || curStatus === "batal") {
      throw new Error(`Transaksi sudah berstatus "${current.rows[0].status}" dan tidak dapat diubah lagi.`);
    }
  }

  let query = 'UPDATE "Transaksi" SET username_roblox = $1, id_suplier = $2, status = $3, rate_robux_suplier = $4, rate_robux_dijual = $5, update_at = CURRENT_TIMESTAMP';
  let params: any[] = [data.username_roblox, data.id_suplier, data.status, data.rate_robux_suplier, data.rate_robux_dijual];
  
  if (data.harga) {
    query += ', harga = $6 WHERE id = $7';
    params.push(data.harga, id);
  } else {
    query += ' WHERE id = $6';
    params.push(id);
  }

  await db.query(query, params);

  // Broadcast to Pusher
  try {
    const updatedTrx = await db.query(`
      SELECT t.*, 
             k.name as kategori_name, 
             g.name as game_name, 
             s.name as suplier_name
      FROM "Transaksi" t
      LEFT JOIN "Kategori" k ON t.id_kategori = k.id
      LEFT JOIN "Game" g ON t.id_game = g.id
      LEFT JOIN "Suplier" s ON t.id_suplier = s.id
      WHERE t.id = $1
    `, [id]);
    if (updatedTrx.rows.length > 0) {
      await triggerPusherEvent("transactions-queue", "transaction-updated", updatedTrx.rows[0]);
    }
  } catch (err) {
    console.warn("Pusher broadcast error on update:", err);
  }

  revalidatePath("/transaksi");
  revalidatePath("/monitor");
}

export async function deleteTransaksi(id: string) {
  const current = await db.query('SELECT status FROM "Transaksi" WHERE id = $1', [id]);
  if (current.rows.length > 0) {
    const curStatus = (current.rows[0].status || "").toLowerCase();
    if (["selesai", "sukses", "batal", "cancel"].includes(curStatus)) {
      throw new Error(`Transaksi berstatus "${current.rows[0].status}" tidak dapat dihapus.`);
    }
  }

  await db.query('DELETE FROM "Transaksi" WHERE id = $1', [id]);

  // Broadcast to Pusher
  try {
    await triggerPusherEvent("transactions-queue", "transaction-deleted", { id });
  } catch (err) {
    console.warn("Pusher broadcast error on delete:", err);
  }

  revalidatePath("/transaksi");
  revalidatePath("/monitor");
}

export async function addProductToTransaksi(id: string, productData: any, qty: number) {
  const current = await db.query('SELECT status, data_order, subtotal, harga, kode_unik FROM "Transaksi" WHERE id = $1', [id]);
  if (current.rows.length === 0) throw new Error("Transaksi tidak ditemukan");
  
  const cur = current.rows[0];
  const curStatus = (cur.status || "").toLowerCase();
  if (curStatus !== "pending" && curStatus !== "belum bayar" && curStatus !== "pay") {
    throw new Error(`Transaksi berstatus "${cur.status}" tidak dapat ditambah produk.`);
  }

  const existingOrder = cur.data_order || [];
  
  // Check if product already exists
  const existingIndex = existingOrder.findIndex((item: any) => item.nama === productData.nama_produk);
  const addSubtotal = Number(productData.harga_jual) * qty;

  if (existingIndex > -1) {
    existingOrder[existingIndex].kuantitas += qty;
    existingOrder[existingIndex].subtotal += addSubtotal;
  } else {
    existingOrder.push({
      nama: productData.nama_produk,
      kuantitas: qty,
      harga: Number(productData.harga_jual),
      subtotal: addSubtotal
    });
  }

  const newSubtotal = Number(cur.subtotal) + addSubtotal;
  const newHarga = newSubtotal + Number(cur.kode_unik);

  await db.query(
    'UPDATE "Transaksi" SET data_order = $1, subtotal = $2, harga = $3, update_at = CURRENT_TIMESTAMP WHERE id = $4',
    [JSON.stringify(existingOrder), newSubtotal, newHarga, id]
  );

  // Broadcast
  try {
    const updatedTrx = await db.query(`
      SELECT t.*, 
             k.name as kategori_name, 
             g.name as game_name, 
             s.name as suplier_name
      FROM "Transaksi" t
      LEFT JOIN "Kategori" k ON t.id_kategori = k.id
      LEFT JOIN "Game" g ON t.id_game = g.id
      LEFT JOIN "Suplier" s ON t.id_suplier = s.id
      WHERE t.id = $1
    `, [id]);
    if (updatedTrx.rows.length > 0) {
      await triggerPusherEvent("transactions-queue", "transaction-updated", updatedTrx.rows[0]);
    }
  } catch (err) {
    console.warn("Pusher broadcast error on add product:", err);
  }
}

export async function clearAllTransaksi() {
  await db.query('DELETE FROM "Transaksi"');
  try {
    await triggerPusherEvent("transactions-queue", "transaction-deleted", { id: "all" });
  } catch (err) {
    console.warn("Pusher broadcast error on clear all:", err);
  }
  revalidatePath("/transaksi");
  revalidatePath("/monitor");
  revalidatePath("/dashboard");
  revalidatePath("/report");
}

export async function updateUsernameRoblox(id: string, username_roblox: string) {
  try {
    await db.query(
      'UPDATE "Transaksi" SET username_roblox = $1, update_at = CURRENT_TIMESTAMP WHERE id = $2',
      [username_roblox, id]
    );
    const updatedTrx = await db.query(`
      SELECT t.id, t.create_at, t.update_at, t.id_kategori, t.id_game, t.id_suplier,
             t.username_tiktok, t.username_roblox, t.harga, t.subtotal, t.kode_unik,
             t.rate_robux_suplier, t.rate_robux_dijual, t.status, t.data_order, t.diskon,
             k.name as kategori_name, g.name as game_name, s.name as suplier_name
      FROM "Transaksi" t
      LEFT JOIN "Kategori" k ON t.id_kategori = k.id
      LEFT JOIN "Game" g ON t.id_game = g.id
      LEFT JOIN "Suplier" s ON t.id_suplier = s.id
      WHERE t.id = $1
    `, [id]);
    if (updatedTrx.rows.length > 0) {
      await triggerPusherEvent("transactions-queue", "transaction-updated", updatedTrx.rows[0]);
    }
    return { success: true };
  } catch (err: any) {
    console.error("Failed to update username_roblox:", err);
    throw new Error(err.message || "Failed to update Roblox username");
  }
}

export async function applyDiscountToTransaksi(id: string, diskonNominal: number) {
  const current = await db.query('SELECT status, harga, subtotal, diskon, kode_unik, data_order FROM "Transaksi" WHERE id = $1', [id]);
  if (current.rows.length === 0) throw new Error("Transaksi tidak ditemukan");

  const cur = current.rows[0];
  const curStatus = (cur.status || "").toLowerCase();
  if (curStatus === "selesai" || curStatus === "cancel" || curStatus === "batal") {
    throw new Error(`Transaksi berstatus "${cur.status}" tidak dapat diberi diskon.`);
  }

  // Calculate new subtotal and harga based on the added discount
  const existingDiskon = Number(cur.diskon) || 0;
  const newDiskon = existingDiskon + diskonNominal;
  const newSubtotal = Math.max(0, Number(cur.subtotal) - diskonNominal);
  const newHarga = newSubtotal + Number(cur.kode_unik);

  let existingOrder = cur.data_order || [];
  if (typeof existingOrder === "string") {
    try { existingOrder = JSON.parse(existingOrder); } catch (e) { existingOrder = []; }
  }
  
  if (!Array.isArray(existingOrder)) existingOrder = [];

  existingOrder.push({
    nama: `Discount Tambahan`,
    kuantitas: 1,
    harga: -diskonNominal,
    subtotal: -diskonNominal
  });

  await db.query(
    'UPDATE "Transaksi" SET diskon = $1, subtotal = $2, harga = $3, data_order = $4, update_at = CURRENT_TIMESTAMP WHERE id = $5',
    [newDiskon, newSubtotal, newHarga, JSON.stringify(existingOrder), id]
  );

  try {
    const updatedTrx = await db.query(`
      SELECT t.*, 
             k.name as kategori_name, 
             g.name as game_name, 
             s.name as suplier_name
      FROM "Transaksi" t
      LEFT JOIN "Kategori" k ON t.id_kategori = k.id
      LEFT JOIN "Game" g ON t.id_game = g.id
      LEFT JOIN "Suplier" s ON t.id_suplier = s.id
      WHERE t.id = $1
    `, [id]);
    if (updatedTrx.rows.length > 0) {
      await triggerPusherEvent("transactions-queue", "transaction-updated", updatedTrx.rows[0]);
    }
  } catch (err) {
    console.warn("Pusher broadcast error on apply discount:", err);
  }

  revalidatePath("/transaksi");
  revalidatePath("/monitor");
}
