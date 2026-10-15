"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { imagekit } from "@/lib/imagekit";
import { randomUUID } from "crypto";
import { verifyPassword, hashPassword } from "@/lib/security";

export async function getResellerProfile() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    const res = await db.query(
      `SELECT 
         u.id, 
         u.username, 
         u.email, 
         u.level, 
         u.balance, 
         u.create_at, 
         u.update_at,
         up.profile_picture_url,
         up.roblox_username,
         up.tiktok_url
       FROM "User" u
       LEFT JOIN "user_profile" up ON up.id_user::text = u.id::text
       WHERE u.id = $1`,
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
  profilePictureBase64?: string | null;
  profilePictureUrl?: string | null;
  robloxUsername?: string | null;
  tiktokUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return { success: false, message: "Sesi Anda telah berakhir, silakan login kembali." };
  }

  try {
    const userRes = await db.query(
      `SELECT id, username, email, password FROM "User" WHERE id = $1`,
      [sessionToken]
    );

    if (userRes.rows.length === 0) {
      return { success: false, message: "User tidak ditemukan." };
    }

    const currentUser = userRes.rows[0];
    let finalProfilePictureUrl = data.profilePictureUrl || null;

    // 1. Upload ke ImageKit jika ada file gambar base64 baru
    if (data.profilePictureBase64) {
      try {
        const uploadRes = await imagekit.upload({
          file: data.profilePictureBase64,
          fileName: `avatar-${currentUser.username || 'user'}-${Date.now()}.png`,
          folder: "/profile_pictures",
          useUniqueFileName: true,
        });
        finalProfilePictureUrl = uploadRes.url;
      } catch (uploadErr: any) {
        console.error("Gagal upload gambar profil ke ImageKit:", uploadErr);
        return { success: false, message: "Gagal upload foto profil ke ImageKit: " + (uploadErr.message || "") };
      }
    }

    // 2. Simpan atau perbarui tabel user_profile
    const robloxUsername = data.robloxUsername?.trim() || null;
    const tiktokUrl = data.tiktokUrl?.trim() || null;
    const profileId = randomUUID();

    await db.query(
      `INSERT INTO "user_profile" (id, id_user, profile_picture_url, roblox_username, tiktok_url, create_at, update_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("id_user")
       DO UPDATE SET
         profile_picture_url = EXCLUDED.profile_picture_url,
         roblox_username = EXCLUDED.roblox_username,
         tiktok_url = EXCLUDED.tiktok_url,
         update_at = NOW()`,
      [profileId, sessionToken, finalProfilePictureUrl, robloxUsername, tiktokUrl]
    );

    // 3. Periksa dan update password jika newPassword diisi
    const newPassword = data.newPassword?.trim();
    const currentPassword = data.currentPassword?.trim();
    const confirmPassword = data.confirmPassword?.trim();

    if (newPassword) {
      if (!currentPassword) {
        return { success: false, message: "Masukkan kata sandi lama untuk mengubah kata sandi." };
      }

      if (!verifyPassword(currentPassword, currentUser.password)) {
        return { success: false, message: "Kata sandi lama yang Anda masukkan salah." };
      }

      if (newPassword.length < 6) {
        return { success: false, message: "Kata sandi baru minimal 6 karakter." };
      }

      if (newPassword !== confirmPassword) {
        return { success: false, message: "Konfirmasi kata sandi baru tidak cocok." };
      }

      const hashedNewPassword = hashPassword(newPassword);

      await db.query(
        `UPDATE "User" 
         SET password = $1, update_at = NOW() 
         WHERE id = $2`,
        [hashedNewPassword, sessionToken]
      );
    }

    revalidatePath("/reseller/dashboard");
    revalidatePath("/reseller/profile");
    revalidatePath("/reseller/profile/update-account");

    return { 
      success: true, 
      message: "Profil akun Anda berhasil diperbarui!",
      profilePictureUrl: finalProfilePictureUrl
    };
  } catch (error: any) {
    console.error("Error updating reseller account:", error);
    return { success: false, message: error.message || "Gagal memperbarui akun." };
  }
}

export interface CheckRobloxResult {
  success: boolean;
  user?: {
    id: number;
    name: string;
    displayName: string;
    avatarUrl: string;
  };
  error?: string;
}

export async function checkRobloxAccount(identifier: string): Promise<CheckRobloxResult> {
  const query = identifier?.trim();
  if (!query) {
    return { success: false, error: "Username Roblox tidak boleh kosong." };
  }

  const robloxApiKey = process.env.ROBLOX_API?.replace(/"/g, "").trim();

  try {
    let robloxUser: { id: number; name: string; displayName: string } | null = null;

    // 1. Cek User ID jika angka
    if (/^\d+$/.test(query)) {
      try {
        const idRes = await fetch(`https://users.roblox.com/v1/users/${query}`, {
          headers: robloxApiKey ? { "x-api-key": robloxApiKey } : undefined,
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(3000),
        });
        if (idRes.ok) {
          const idData = await idRes.json();
          if (idData && idData.id) {
            robloxUser = {
              id: idData.id,
              name: idData.name,
              displayName: idData.displayName || idData.name,
            };
          }
        }
      } catch (err) {
        console.error("Gagal lookup Roblox by ID:", err);
      }
    }

    // 2. Lookup via Roblox usernames API
    if (!robloxUser) {
      try {
        const usernameRes = await fetch("https://users.roblox.com/v1/usernames/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(robloxApiKey ? { "x-api-key": robloxApiKey } : {}),
          },
          body: JSON.stringify({
            usernames: [query],
            excludeBannedUsers: false,
          }),
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(3000),
        });

        if (usernameRes.ok) {
          const usernameData = await usernameRes.json();
          if (usernameData.data && usernameData.data.length > 0) {
            const u = usernameData.data[0];
            robloxUser = {
              id: u.id,
              name: u.name,
              displayName: u.displayName || u.name,
            };
          }
        }
      } catch (userLookupErr) {
        console.error("Gagal lookup Roblox by Username:", userLookupErr);
      }
    }

    if (!robloxUser) {
      return { success: false, error: "Akun Roblox tidak ditemukan. Periksa kembali username Anda." };
    }

    // 3. Ambil avatar thumbnail resolusi tinggi
    let avatarUrl = "";
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUser.id}&size=420x420&format=Png&isCircular=false`,
        {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(3000),
        }
      );
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData.data && thumbData.data.length > 0 && thumbData.data[0].imageUrl) {
          avatarUrl = thumbData.data[0].imageUrl;
        }
      }
    } catch (thumbErr) {
      console.error("Gagal mengambil avatar thumbnail Roblox:", thumbErr);
    }

    return {
      success: true,
      user: {
        id: robloxUser.id,
        name: robloxUser.name,
        displayName: robloxUser.displayName,
        avatarUrl,
      },
    };
  } catch (err: any) {
    console.error("Error checkRobloxAccount:", err);
    return { success: false, error: "Terjadi kesalahan saat memeriksa akun Roblox." };
  }
}

