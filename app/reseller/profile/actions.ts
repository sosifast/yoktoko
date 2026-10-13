"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getResellerProfile() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    const res = await db.query(
      `SELECT id, username, email, level, balance, create_at, update_at 
       FROM "User" 
       WHERE id = $1`,
      [sessionToken]
    );

    if (res.rows.length === 0) return null;
    return res.rows[0];
  } catch (error) {
    console.error("Error fetching reseller profile:", error);
    return null;
  }
}

export async function updateResellerAccount(data: {
  username: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return { success: false, message: "Sesi Anda telah berakhir, silakan login kembali." };
  }

  const username = data.username?.trim();
  const email = data.email?.trim() || null;
  const currentPassword = data.currentPassword?.trim();
  const newPassword = data.newPassword?.trim();
  const confirmPassword = data.confirmPassword?.trim();

  if (!username || username.length < 3) {
    return { success: false, message: "Username minimal 3 karakter." };
  }

  try {
    // 1. Ambil data user saat ini
    const userRes = await db.query(
      `SELECT id, username, email, password FROM "User" WHERE id = $1`,
      [sessionToken]
    );

    if (userRes.rows.length === 0) {
      return { success: false, message: "User tidak ditemukan." };
    }

    const currentUser = userRes.rows[0];

    // 2. Cek apakah username sudah digunakan user lain
    const checkUser = await db.query(
      `SELECT id FROM "User" WHERE LOWER(username) = LOWER($1) AND id != $2`,
      [username, sessionToken]
    );
    if (checkUser.rows.length > 0) {
      return { success: false, message: "Username sudah digunakan oleh akun lain." };
    }

    // 3. Cek apakah email sudah digunakan user lain (jika diisi)
    if (email) {
      const checkEmail = await db.query(
        `SELECT id FROM "User" WHERE LOWER(email) = LOWER($1) AND id != $2`,
        [email, sessionToken]
      );
      if (checkEmail.rows.length > 0) {
        return { success: false, message: "Email sudah digunakan oleh akun lain." };
      }
    }

    // 4. Cek pergantian password jika newPassword diisi
    if (newPassword) {
      if (!currentPassword) {
        return { success: false, message: "Masukkan kata sandi lama untuk mengubah kata sandi." };
      }

      if (currentUser.password !== currentPassword) {
        return { success: false, message: "Kata sandi lama yang Anda masukkan salah." };
      }

      if (newPassword.length < 6) {
        return { success: false, message: "Kata sandi baru minimal 6 karakter." };
      }

      if (newPassword !== confirmPassword) {
        return { success: false, message: "Konfirmasi kata sandi baru tidak cocok." };
      }

      // Update dengan password baru
      await db.query(
        `UPDATE "User" 
         SET username = $1, email = $2, password = $3, update_at = NOW() 
         WHERE id = $4`,
        [username, email, newPassword, sessionToken]
      );
    } else {
      // Update tanpa mengubah password
      await db.query(
        `UPDATE "User" 
         SET username = $1, email = $2, update_at = NOW() 
         WHERE id = $3`,
        [username, email, sessionToken]
      );
    }

    revalidatePath("/reseller/dashboard");
    revalidatePath("/reseller/profile");
    revalidatePath("/reseller/profile/update-account");

    return { success: true, message: "Akun Anda berhasil diperbarui!" };
  } catch (error: any) {
    console.error("Error updating reseller account:", error);
    return { success: false, message: error.message || "Gagal memperbarui akun." };
  }
}
