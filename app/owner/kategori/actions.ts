"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-guard";
import { sanitizeString } from "@/lib/security";

export async function getKategori() {
  const result = await db.query('SELECT * FROM "Kategori" ORDER BY create_at DESC');
  return result.rows;
}

export async function createKategori(data: { name: string; slug: string }) {
  await requireOwner();
  const name = sanitizeString(data.name, 100);
  const slug = sanitizeString(data.slug, 100);
  await db.query('INSERT INTO "Kategori" (name, slug) VALUES ($1, $2)', [name, slug]);
  revalidatePath("/kategori");
  revalidatePath("/owner/kategori");
}

export async function updateKategori(id: string, data: { name: string; slug: string }) {
  await requireOwner();
  const name = sanitizeString(data.name, 100);
  const slug = sanitizeString(data.slug, 100);
  await db.query('UPDATE "Kategori" SET name = $1, slug = $2, update_at = CURRENT_TIMESTAMP WHERE id = $3', [
    name,
    slug,
    id,
  ]);
  revalidatePath("/kategori");
  revalidatePath("/owner/kategori");
}

export async function deleteKategori(id: string) {
  await requireOwner();
  await db.query('DELETE FROM "Kategori" WHERE id = $1', [id]);
  revalidatePath("/kategori");
  revalidatePath("/owner/kategori");
}
