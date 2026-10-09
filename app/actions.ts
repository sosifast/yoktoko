"use server";
import crypto from "crypto";

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
export async function registerReseller(username: string, email: string, password: string) {
  const existingUser = await db.query('SELECT id FROM "User" WHERE username = $1 OR email = $2', [username, email]);
  
  if (existingUser.rows.length > 0) {
    throw new Error("Username or Email already taken");
  }

  const newId = crypto.randomUUID();
  const level = "Reseller";
  
  await db.query(
    'INSERT INTO "User" (id, username, email, password, level, balance, update_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
    [newId, username, email, password, level, 0]
  );
  
  return { success: true };
}
