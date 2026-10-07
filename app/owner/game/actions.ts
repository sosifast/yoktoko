"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getGames() {
  const result = await db.query('SELECT * FROM "Game" ORDER BY create_at DESC');
  return result.rows;
}

export async function createGame(data: { name: string; slug: string; image_url?: string }) {
  await db.query('INSERT INTO "Game" (name, slug, image_url) VALUES ($1, $2, $3)', [data.name, data.slug, data.image_url || null]);
  revalidatePath("/game");
}

export async function updateGame(id: string, data: { name: string; slug: string; image_url?: string }) {
  await db.query('UPDATE "Game" SET name = $1, slug = $2, image_url = $3, update_at = CURRENT_TIMESTAMP WHERE id = $4', [
    data.name,
    data.slug,
    data.image_url || null,
    id,
  ]);
  revalidatePath("/game");
}

export async function deleteGame(id: string) {
  await db.query('DELETE FROM "Game" WHERE id = $1', [id]);
  revalidatePath("/game");
}
