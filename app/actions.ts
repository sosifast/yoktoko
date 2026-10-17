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
  const signature = await createSessionSignature(String(user.id), level);
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

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  cookieStore.delete("user_level");
  cookieStore.delete("session_sig");
  return { success: true };
}
