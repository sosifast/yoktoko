"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSupliers() {
  const result = await db.query('SELECT * FROM "Suplier" ORDER BY create_at DESC');
  return result.rows;
}

export async function createSuplier(data: { name: string; slug: string }) {
  await db.query('INSERT INTO "Suplier" (name, slug) VALUES ($1, $2)', [data.name, data.slug]);
  revalidatePath("/suplier");
}

export async function updateSuplier(id: string, data: { name: string; slug: string }) {
  await db.query(
    'UPDATE "Suplier" SET name = $1, slug = $2, update_at = CURRENT_TIMESTAMP WHERE id = $3',
    [data.name, data.slug, id]
  );
  revalidatePath("/suplier");
}

export async function deleteSuplier(id: string) {
  await db.query('DELETE FROM "Suplier" WHERE id = $1', [id]);
  revalidatePath("/suplier");
}
