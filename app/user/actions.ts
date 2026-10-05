"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  const result = await db.query('SELECT * FROM "User" ORDER BY create_at DESC');
  return result.rows;
}

export async function deleteUser(id: string) {
  await db.query('DELETE FROM "User" WHERE id = $1', [id]);
  revalidatePath("/user");
}
