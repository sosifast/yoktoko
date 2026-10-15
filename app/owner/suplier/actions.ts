"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-guard";
import { sanitizeString } from "@/lib/security";

export async function getSupliers() {
  await requireOwner();
  const result = await db.query('SELECT * FROM "Suplier" ORDER BY create_at DESC');
  return result.rows;
}

export async function createSuplier(data: { name: string; slug: string }) {
  await requireOwner();
  const name = sanitizeString(data.name, 100);
  const slug = sanitizeString(data.slug, 100);
  await db.query('INSERT INTO "Suplier" (name, slug) VALUES ($1, $2)', [name, slug]);
  revalidatePath("/suplier");
  revalidatePath("/owner/suplier");
}

export async function updateSuplier(id: string, data: { name: string; slug: string }) {
  await requireOwner();
  const name = sanitizeString(data.name, 100);
  const slug = sanitizeString(data.slug, 100);
  await db.query(
    'UPDATE "Suplier" SET name = $1, slug = $2, update_at = CURRENT_TIMESTAMP WHERE id = $3',
    [name, slug, id]
  );
  revalidatePath("/suplier");
  revalidatePath("/owner/suplier");
}

export async function deleteSuplier(id: string) {
  await requireOwner();
  await db.query('DELETE FROM "Suplier" WHERE id = $1', [id]);
  revalidatePath("/suplier");
  revalidatePath("/owner/suplier");
}
