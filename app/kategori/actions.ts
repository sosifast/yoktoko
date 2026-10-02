"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getKategori() {
  const result = await db.query('SELECT * FROM "Kategori" ORDER BY create_at DESC');
  return result.rows;
}

export async function createKategori(data: { name: string; slug: string }) {
  await db.query('INSERT INTO "Kategori" (name, slug) VALUES ($1, $2)', [data.name, data.slug]);
  revalidatePath("/kategori");
}

export async function updateKategori(id: string, data: { name: string; slug: string }) {
  await db.query('UPDATE "Kategori" SET name = $1, slug = $2, update_at = CURRENT_TIMESTAMP WHERE id = $3', [
    data.name,
    data.slug,
    id,
  ]);
  revalidatePath("/kategori");
}

export async function deleteKategori(id: string) {
  await db.query('DELETE FROM "Kategori" WHERE id = $1', [id]);
  revalidatePath("/kategori");
}
