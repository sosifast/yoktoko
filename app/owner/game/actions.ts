"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-guard";
import { sanitizeString } from "@/lib/security";

export async function getGames() {
  const result = await db.query('SELECT * FROM "Game" ORDER BY create_at DESC');
  return result.rows;
}

export async function createGame(data: { name: string; slug: string; image_url?: string }) {
  await requireOwner();
  const name = sanitizeString(data.name, 100);
  const slug = sanitizeString(data.slug, 100);
  await db.query('INSERT INTO "Game" (name, slug, image_url) VALUES ($1, $2, $3)', [name, slug, data.image_url || null]);
  revalidatePath("/game");
  revalidatePath("/owner/game");
}

export async function updateGame(id: string, data: { name: string; slug: string; image_url?: string }) {
  await requireOwner();
  const name = sanitizeString(data.name, 100);
  const slug = sanitizeString(data.slug, 100);
  await db.query('UPDATE "Game" SET name = $1, slug = $2, image_url = $3, update_at = CURRENT_TIMESTAMP WHERE id = $4', [
    name,
    slug,
    data.image_url || null,
    id,
  ]);
  revalidatePath("/game");
  revalidatePath("/owner/game");
}

export async function deleteGame(id: string) {
  await requireOwner();
  await db.query('DELETE FROM "Game" WHERE id = $1', [id]);
  revalidatePath("/game");
  revalidatePath("/owner/game");
}
