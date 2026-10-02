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

export async function getTransaksi() {
  const result = await db.query(`
    SELECT t.*, 
           k.name as kategori_name, 
           g.name as game_name, 
           s.name as suplier_name
    FROM "Transaksi" t
    LEFT JOIN "Kategori" k ON t.id_kategori = k.id
    LEFT JOIN "Game" g ON t.id_game = g.id
    LEFT JOIN "Suplier" s ON t.id_suplier = s.id
    ORDER BY t.create_at DESC
  `);
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
      AND status IN ('Pending', 'Bayar')
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
      data_order, status, kode_unik
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
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
    if (curStatus === "selesai" || curStatus === "batal") {
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

export async function deleteTransaksi(id: string) {
  const current = await db.query('SELECT status FROM "Transaksi" WHERE id = $1', [id]);
  if (current.rows.length > 0) {
    const curStatus = (current.rows[0].status || "").toLowerCase();
    if (["selesai", "sukses", "batal"].includes(curStatus)) {
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
