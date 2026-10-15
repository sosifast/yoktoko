"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-guard";
import { hashPassword, sanitizeString } from "@/lib/security";

export async function getUsers() {
  await requireOwner();
  const result = await db.query('SELECT id, username, email, level, balance, create_at, update_at FROM "User" ORDER BY create_at DESC');
  return result.rows;
}

export async function deleteUser(id: string) {
  await requireOwner();
  await db.query('DELETE FROM "User" WHERE id = $1', [id]);
  revalidatePath("/owner/user");
}

export async function getUserById(id: string) {
  const result = await db.query('SELECT id, username, email, level, balance, create_at, update_at FROM "User" WHERE id = $1', [id]);
  return result.rows[0];
}

export async function createUser(data: { username: string; email?: string; level: string; password?: string }) {
  await requireOwner();
  const username = sanitizeString(data.username, 50);
  const email = data.email ? sanitizeString(data.email, 100) : null;
  const rawPassword = data.password?.trim() || "123456";
  const hashedPassword = hashPassword(rawPassword);

  await db.query(
    'INSERT INTO "User" (username, email, password, level, update_at) VALUES ($1, $2, $3, $4, NOW())',
    [username, email, hashedPassword, data.level]
  );
  revalidatePath("/owner/user");
}

export async function updateUser(id: string, data: { username: string; email?: string; level: string; balance?: number }) {
  await requireOwner();
  const username = sanitizeString(data.username, 50);
  const email = data.email ? sanitizeString(data.email, 100) : null;

  await db.query(
    'UPDATE "User" SET username = $1, email = $2, level = $3, balance = $4, update_at = NOW() WHERE id = $5',
    [username, email, data.level, data.balance ?? 0, id]
  );
  revalidatePath("/owner/user");
}
