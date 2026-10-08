"use server";

import { db } from "@/lib/db";

export async function loginUser(username: string, password: string) {
  const result = await db.query('SELECT * FROM "User" WHERE username = $1', [username]);
  const user = result.rows[0];

  if (!user) {
    throw new Error("User not found");
  }

  if (user.password !== password) {
    throw new Error("Invalid password");
  }

  return {
    id: user.id,
    username: user.username,
    level: user.level
  };
}
