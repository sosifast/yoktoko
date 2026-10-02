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
}) {
  await db.query(`
    INSERT INTO "Produk" 
    (id_kategori, id_game, nama_produk, slug, harga_jual, rate_robux_suplier, rate_robux_dijual, harga_robux_sebelum_diskon, harga_robux_sudah_diskon) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    data.id_kategori, data.id_game, data.nama_produk, data.slug, 
    data.harga_jual, data.rate_robux_suplier, data.rate_robux_dijual,
    data.harga_robux_sebelum_diskon, data.harga_robux_sudah_diskon
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
}) {
  await db.query(`
    UPDATE "Produk" 
    SET id_kategori = $1, id_game = $2, nama_produk = $3, slug = $4, 
        harga_jual = $5, rate_robux_suplier = $6, rate_robux_dijual = $7,
        harga_robux_sebelum_diskon = $8, harga_robux_sudah_diskon = $9,
        update_at = CURRENT_TIMESTAMP 
    WHERE id = $10
  `, [
    data.id_kategori, data.id_game, data.nama_produk, data.slug, 
    data.harga_jual, data.rate_robux_suplier, data.rate_robux_dijual,
    data.harga_robux_sebelum_diskon, data.harga_robux_sudah_diskon,
    id
  ]);
  revalidatePath("/produk");
}

export async function deleteProduk(id: string) {
  await db.query('DELETE FROM "Produk" WHERE id = $1', [id]);
  revalidatePath("/produk");
}
