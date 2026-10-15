"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";
import { getBaseUrl } from "@/lib/base-url";
import crypto from "crypto";

export async function processVIPCheckout(planId: string) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    let userId = "";

    if (sessionToken) {
      const user = await getUserById(sessionToken);
      if (user && user.id) userId = user.id;
    }

    if (!userId) {
      return {
        success: false,
        error: "Sesi login telah berakhir. Silakan login kembali.",
        redirectTo: "/auth/login",
      };
    }

    // 1. Cek apakah pengguna sudah memiliki tagihan pending untuk paket ini dalam 30 menit terakhir
    const existingPending = await db.query(
      `SELECT * FROM "history_reseller_plan" 
       WHERE id_user = $1 
         AND id_reseller_plan = $2 
         AND status_pembayaran = 'Pending' 
         AND bukti_bayar_url IS NOT NULL 
         AND create_at > NOW() - INTERVAL '30 minutes'
       ORDER BY create_at DESC LIMIT 1`,
      [userId, planId]
    );

    if (existingPending.rows.length > 0 && existingPending.rows[0].bukti_bayar_url) {
      // Gunakan tagihan yang sudah aktif untuk mencegah duplicate invoice di PG
      const existingRef = existingPending.rows[0].bukti_bayar_url;
      return {
        success: true,
        reference: existingRef,
        redirectTo: `/reseller/payment?ref=${encodeURIComponent(existingRef)}`,
      };
    }

    // 2. Ambil detail plan
    const planCheck = await db.query(`SELECT * FROM "reseller_plan" WHERE id = $1`, [planId]);
    if (planCheck.rows.length === 0) {
      return { success: false, error: "Paket VIP tidak ditemukan." };
    }
    const currentPlan = planCheck.rows[0];

    // 3. Buat historyId baru
    const historyId = crypto.randomUUID();
    const startDate = new Date();
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + (currentPlan.durasi || 30));

    // Simpan ke database dengan status Pending
    await db.query(
      `INSERT INTO "history_reseller_plan" 
       (id, id_reseller_plan, id_user, price, start_date, expired_date, status_pembayaran, is_active, create_at, update_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending', 0, NOW(), NOW())`,
      [historyId, planId, userId, currentPlan.price, startDate, expiredDate]
    );

    const isSandbox = process.env.PGKU_MODE === "SANDBOX";
    const baseUrl = isSandbox ? process.env.PGKU_SANDBOX_URL : process.env.PGKU_PRODUCTION_URL;
    const endpoint = isSandbox ? "sandbox/payment/create" : "production/payment/create";
    const origin = await getBaseUrl();

    // 4. Request ke Payment Gateway dengan timeout 10 detik
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${baseUrl}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.PGKU_API_KEY!,
        kode_api: process.env.PGKU_KODE_API!,
      },
      body: JSON.stringify({
        method: "QRIS",
        amount: currentPlan.price,
        name: `VIP Membership - ${currentPlan.paket}`,
        merchant_ref: historyId,
        callback_url: `${origin}/api/payment/webhook`,
        return_url: `${origin}/reseller/vip/history`,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.success && data.data?.reference) {
      const ref = data.data.reference;
      await db.query(
        `UPDATE "history_reseller_plan" SET bukti_bayar_url = $1 WHERE id = $2`,
        [ref, historyId]
      );

      return {
        success: true,
        reference: ref,
        redirectTo: `/reseller/payment?ref=${encodeURIComponent(ref)}`,
      };
    } else {
      console.error("Payment Gateway API Error:", data);
      return {
        success: false,
        error: data.message || "Gagal membuat tagihan pembayaran pada Payment Gateway.",
      };
    }
  } catch (error: any) {
    console.error("Error in processVIPCheckout:", error);
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "Server Payment Gateway sedang sibuk/timeout. Silakan coba beberapa saat lagi.",
      };
    }
    return {
      success: false,
      error: error.message || "Terjadi kendala saat memproses checkout.",
    };
  }
}
