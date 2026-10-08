"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  const result = await db.query('SELECT * FROM "User" ORDER BY create_at DESC');
  return result.rows;
}

export async function deleteUser(id: string) {
  await db.query('DELETE FROM "User" WHERE id = $1', [id]);
  revalidatePath("/owner/user");
}

export async function getUserById(id: string) {
  const result = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
  return result.rows[0];
}

export async function createUser(data: { username: string; email?: string; level: string; password?: string }) {
  await db.query(
    'INSERT INTO "User" (username, email, password, level) VALUES ($1, $2, $3, $4)',
    [data.username, data.email || null, data.password || '123456', data.level]
  );
  revalidatePath("/owner/user");
}

export async function updateUser(id: string, data: { username: string; email?: string; level: string; balance?: number }) {
  await db.query(
    'UPDATE "User" SET username = $1, email = $2, level = $3, balance = $4 WHERE id = $5',
    [data.username, data.email || null, data.level, data.balance ?? 0, id]
  );
  revalidatePath("/owner/user");
}
