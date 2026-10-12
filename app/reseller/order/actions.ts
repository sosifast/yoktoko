"use server";

import { db } from "@/lib/db";
import { imagekit } from "@/lib/imagekit";
import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";
import { revalidatePath } from "next/cache";

export interface RobloxUserResult {
  success: boolean;
  user?: {
    id: number;
    name: string;
    displayName: string;
    avatarUrl?: string;
  };
  error?: string;
}

export interface CreateOrderItem {
  id_produk: string;
  qty: number;
  price: number;
}

export interface CreateOrderPayload {
  id_game: string;
  username_roblox: string;
  items: CreateOrderItem[];
  bukti_bayar_base64?: string;
  kode_unik?: number;
}

export interface CreateOrderResult {
  success: boolean;
  invoices?: string[];
  bukti_url?: string | null;
  error?: string;
}

export async function lookupRobloxUser(identifier: string): Promise<RobloxUserResult> {
  const query = identifier?.trim();
  if (!query) {
    return { success: false, error: "Username atau User ID Roblox tidak boleh kosong." };
  }

  const robloxApiKey = process.env.ROBLOX_API?.replace(/"/g, '').trim();

  try {
    let robloxUser: { id: number; name: string; displayName: string } | null = null;

    // 1. Jika input berupa angka murni, cek by User ID terlebih dahulu
    if (/^\d+$/.test(query)) {
      try {
        const idRes = await fetch(`https://users.roblox.com/v1/users/${query}`, {
          headers: robloxApiKey ? { "x-api-key": robloxApiKey } : undefined,
          cache: "no-store",
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

    // 2. Jika belum ditemukan atau input berupa teks username, lookup via Roblox usernames API
    if (!robloxUser) {
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
        cache: "no-store",
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
    }

    if (!robloxUser) {
      return { success: false, error: "Akun Roblox tidak ditemukan. Periksa kembali username atau User ID Anda." };
    }

    // 3. Ambil avatar headshot thumbnail resmi dari Roblox
    let avatarUrl = "";
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUser.id}&size=150x150&format=Png&isCircular=true`,
        { cache: "no-store" }
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
    console.error("Error lookupRobloxUser:", err);
    return { success: false, error: "Terjadi kesalahan saat memeriksa akun Roblox ke server." };
  }
}

export async function createResellerOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
  if (!payload.items || payload.items.length === 0) {
    return { success: false, error: "Keranjang belanja kosong." };
  }
  if (!payload.username_roblox?.trim()) {
    return { success: false, error: "Username Roblox wajib diisi dan diverifikasi." };
  }

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    if (!sessionToken) {
      return { success: false, error: "Sesi login berakhir. Silakan login kembali." };
    }

    const user = await getUserById(sessionToken);
    if (!user || !user.id) {
      return { success: false, error: "Akun tidak ditemukan. Silakan login kembali." };
    }

    // Upload bukti bayar ke ImageKit jika dilampirkan
    let buktiBayarUrl: string | null = null;
    if (payload.bukti_bayar_base64) {
      try {
        const uploadRes = await imagekit.upload({
          file: payload.bukti_bayar_base64,
          fileName: `bukti-reseller-${user.username || 'user'}-${Date.now()}.png`,
          folder: "/bukti_transaksi_reseller",
          useUniqueFileName: true,
        });
        buktiBayarUrl = uploadRes.url;
      } catch (uploadErr: any) {
        console.error("Gagal upload gambar ke ImageKit:", uploadErr);
        return { success: false, error: "Gagal upload bukti transfer ke ImageKit: " + (uploadErr.message || "") };
      }
    }

    const createdInvoices: string[] = [];
    const statusPembayaran = buktiBayarUrl ? "Cek Pembayaran" : "Pending";

    // Hitung kode unik berurutan 1 sampai 99 (misal: 1, 2, 3, 4 ... 99, lalu berulang: 5001, 5002, 5003, ...)
    let uniqueCode = 1;
    try {
      const countRes = await db.query(`SELECT COUNT(*) as total FROM "transaksi_reseller"`);
      const totalCount = Number(countRes.rows[0]?.total) || 0;
      uniqueCode = (totalCount % 99) + 1;
    } catch (e) {
      console.error("Gagal mendapatkan urutan kode unik:", e);
      uniqueCode = 1;
    }

    for (let i = 0; i < payload.items.length; i++) {
      const item = payload.items[i];
      const invoice = `INV-RS-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}${payload.items.length > 1 ? `-${i + 1}` : ''}`;
      const id = crypto.randomUUID();
      // Tambahkan kode unik berurutan (1-99) ke total harga item pertama
      const totalPrice = Number(item.price) * item.qty + (i === 0 ? uniqueCode : 0);

      await db.query(`
        INSERT INTO "transaksi_reseller" (
          id, id_user, invoice, id_produk, id_game, price,
          status_pembayaran, bukti_status_pembayaran_url, username_roblox, status_transaksi,
          create_at, update_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        id,
        user.id,
        invoice,
        item.id_produk,
        payload.id_game,
        totalPrice,
        statusPembayaran,
        buktiBayarUrl,
        payload.username_roblox.trim()
      ]);

      createdInvoices.push(invoice);
    }

    revalidatePath("/reseller/order");
    revalidatePath("/reseller/transaksi");
    revalidatePath("/owner/trx-seller");

    return {
      success: true,
      invoices: createdInvoices,
      bukti_url: buktiBayarUrl,
    };
  } catch (err: any) {
    console.error("Error createResellerOrder:", err);
    return { success: false, error: err.message || "Gagal membuat transaksi reseller." };
  }
}

export interface UploadProofResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadResellerPaymentProof(
  invoices: string[],
  base64Image: string
): Promise<UploadProofResult> {
  if (!invoices || invoices.length === 0) {
    return { success: false, error: "Nomor invoice tidak ditemukan." };
  }
  if (!base64Image) {
    return { success: false, error: "File bukti pembayaran tidak ditemukan." };
  }

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    if (!sessionToken) {
      return { success: false, error: "Sesi login berakhir. Silakan login kembali." };
    }

    const user = await getUserById(sessionToken);
    if (!user || !user.id) {
      return { success: false, error: "Akun tidak ditemukan. Silakan login kembali." };
    }

    // Upload ke ImageKit
    const uploadRes = await imagekit.upload({
      file: base64Image,
      fileName: `bukti-reseller-${user.username || 'user'}-${Date.now()}.png`,
      folder: "/bukti_transaksi_reseller",
      useUniqueFileName: true,
    });

    const buktiUrl = uploadRes.url;

    // Update transaksi_reseller
    for (const inv of invoices) {
      await db.query(`
        UPDATE "transaksi_reseller"
        SET bukti_status_pembayaran_url = $1,
            status_pembayaran = 'Cek Pembayaran',
            update_at = CURRENT_TIMESTAMP
        WHERE invoice = $2 AND id_user = $3
      `, [buktiUrl, inv, user.id]);
    }

    revalidatePath("/reseller/transaksi");
    revalidatePath("/reseller/order");
    revalidatePath("/owner/trx-seller");

    return { success: true, url: buktiUrl };
  } catch (err: any) {
    console.error("Error uploadResellerPaymentProof:", err);
    return { success: false, error: err.message || "Gagal mengunggah bukti pembayaran ke ImageKit." };
  }
}

