"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSessionSignature,
  sanitizeString,
} from "@/lib/security";

export async function loginUser(usernameInput: string, passwordInput: string) {
  const username = sanitizeString(usernameInput, 50);
  const password = String(passwordInput || "").trim();

  if (!username || !password) {
    throw new Error("Username dan kata sandi wajib diisi");
  }

  const result = await db.query('SELECT * FROM "User" WHERE LOWER(username) = LOWER($1)', [username]);
  const user = result.rows[0];

  if (!user) {
    throw new Error("Pengguna tidak ditemukan");
  }

  const isPasswordValid = verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Kata sandi salah");
  }

  // Jika password masih berupa plaintext legacy, lakukan auto-upgrade ke hash scrypt
  if (!user.password.startsWith("scrypt:")) {
    try {
      const newHash = hashPassword(password);
      await db.query('UPDATE "User" SET password = $1, update_at = NOW() WHERE id = $2', [newHash, user.id]);
    } catch (upgradeErr) {
      console.warn("Gagal upgrade legacy password:", upgradeErr);
    }
  }

  const level = String(user.level || "reseller").toLowerCase();
  const signature = createSessionSignature(String(user.id), level);
  const isProduction = process.env.NODE_ENV === "production";

  // Simpan cookie secara aman (HttpOnly, Secure in prod, SameSite Lax)
  const cookieStore = await cookies();
  cookieStore.set("session_token", String(user.id), {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 86400 * 7, // 7 hari
  });

  cookieStore.set("user_level", level, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 86400 * 7,
  });

  cookieStore.set("session_sig", signature, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 86400 * 7,
  });

  return {
    id: user.id,
    username: user.username,
    level,
  };
}

export async function registerReseller(usernameInput: string, emailInput: string, passwordInput: string) {
  const username = sanitizeString(usernameInput, 50);
  const email = sanitizeString(emailInput, 100);
  const password = String(passwordInput || "").trim();

  if (!username || username.length < 3) {
    throw new Error("Username minimal 3 karakter");
  }

  if (!password || password.length < 6) {
    throw new Error("Kata sandi minimal 6 karakter");
  }

  const existingUser = await db.query(
    'SELECT id FROM "User" WHERE LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($2))',
    [username, email]
  );
  
  if (existingUser.rows.length > 0) {
    throw new Error("Username atau Email sudah terdaftar");
  }

  const newId = crypto.randomUUID();
  const level = "Reseller";
  const hashedPassword = hashPassword(password);
  
  await db.query(
    'INSERT INTO "User" (id, username, email, password, level, balance, update_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
    [newId, username, email || null, hashedPassword, level, 0]
  );
  
  return { success: true };
}
