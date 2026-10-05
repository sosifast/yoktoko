"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getProduk() {
  const result = await db.query(`
    SELECT p.*, k.name as kategori_name, g.name as game_name 
    FROM "Produk" p
    LEFT JOIN "Kategori" k ON p.id_kategori = k.id
    LEFT JOIN "Game" g ON p.id_game = g.id
    ORDER BY p.create_at DESC
  `);
  return result.rows;
}

export async function getDropdownData() {
  const [categories, games] = await Promise.all([
    db.query('SELECT id, name FROM "Kategori" ORDER BY name ASC'),
    db.query('SELECT id, name FROM "Game" ORDER BY name ASC')
  ]);
  return {
    categories: categories.rows,
    games: games.rows
  };
}

export async function createProduk(data: { 
  id_kategori: string; 
  id_game: string; 
  nama_produk: string; 
  slug: string; 
  harga_jual: number; 
  rate_robux_suplier: number; 
  rate_robux_dijual: number;
  harga_robux_sebelum_diskon: number;
  harga_robux_sudah_diskon: number;
  penggunaan_robux: number;
  is_discount: boolean;
}) {
  await db.query(`
    INSERT INTO "Produk" 
    (id_kategori, id_game, nama_produk, slug, harga_jual, rate_robux_suplier, rate_robux_dijual, harga_robux_sebelum_diskon, harga_robux_sudah_diskon, penggunaan_robux, is_discount) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    data.id_kategori, data.id_game, data.nama_produk, data.slug, 
    data.harga_jual, data.rate_robux_suplier, data.rate_robux_dijual,
    data.harga_robux_sebelum_diskon, data.harga_robux_sudah_diskon,
    data.penggunaan_robux, data.is_discount
  ]);
  revalidatePath("/produk");
}

export async function updateProduk(id: string, data: { 
  id_kategori: string; 
  id_game: string; 
  nama_produk: string; 
  slug: string; 
  harga_jual: number; 
  rate_robux_suplier: number; 
  rate_robux_dijual: number;
  harga_robux_sebelum_diskon: number;
  harga_robux_sudah_diskon: number;
  penggunaan_robux: number;
  is_discount: boolean;
}) {
  await db.query(`
    UPDATE "Produk" 
    SET id_kategori = $1, id_game = $2, nama_produk = $3, slug = $4, 
        harga_jual = $5, rate_robux_suplier = $6, rate_robux_dijual = $7,
        harga_robux_sebelum_diskon = $8, harga_robux_sudah_diskon = $9,
        penggunaan_robux = $10, is_discount = $11,
        update_at = CURRENT_TIMESTAMP 
    WHERE id = $12
  `, [
    data.id_kategori, data.id_game, data.nama_produk, data.slug, 
    data.harga_jual, data.rate_robux_suplier, data.rate_robux_dijual,
    data.harga_robux_sebelum_diskon, data.harga_robux_sudah_diskon,
    data.penggunaan_robux, data.is_discount,
    id
  ]);
  revalidatePath("/produk");
}

export async function deleteProduk(id: string) {
  await db.query('DELETE FROM "Produk" WHERE id = $1', [id]);
  revalidatePath("/produk");
}

export async function bulkUpdateRate(data: {
  id_game?: string;
  update_rate_suplier: boolean;
  rate_robux_suplier?: number;
  update_rate_jual: boolean;
  rate_robux_dijual?: number;
  update_harga_jual?: boolean;
}) {
  if (!data.update_rate_suplier && !data.update_rate_jual) {
    throw new Error("Pilih setidaknya satu rate yang ingin updated (Supplier Rate atau Selling Rate).");
  }

  const setClauses: string[] = ["update_at = CURRENT_TIMESTAMP"];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.update_rate_suplier && typeof data.rate_robux_suplier === "number") {
    setClauses.push(`rate_robux_suplier = $${paramIndex++}`);
    params.push(data.rate_robux_suplier);
  }

  if (data.update_rate_jual && typeof data.rate_robux_dijual === "number") {
    const rateJualParam = paramIndex++;
    setClauses.push(`rate_robux_dijual = $${rateJualParam}`);
    params.push(data.rate_robux_dijual);

    if (data.update_harga_jual) {
      setClauses.push(`harga_jual = CASE WHEN penggunaan_robux > 0 THEN ($${rateJualParam} * penggunaan_robux) ELSE harga_jual END`);
    }
  }

  let whereClause = "";
  if (data.id_game && data.id_game !== "all" && data.id_game.trim() !== "") {
    whereClause = `WHERE id_game = $${paramIndex++}`;
    params.push(data.id_game);
  }

  const query = `
    UPDATE "Produk"
    SET ${setClauses.join(", ")}
    ${whereClause}
  `;

  const result = await db.query(query, params);
  revalidatePath("/produk");
  return { updatedCount: result.rowCount || 0 };
}
