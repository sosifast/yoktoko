import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markPlanPaymentSuccess } from "@/lib/payment-service";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[Cron Security Alert] CRON_SECRET wajib diatur di production.");
      return false;
    }
    return true;
  }

  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");

  return authHeader === `Bearer ${secret}` || querySecret === secret;
}

async function handleSyncPaymentGateway() {
  const startTime = Date.now();
  const isSandbox = process.env.PGKU_MODE === "SANDBOX";
  const baseUrl = isSandbox ? process.env.PGKU_SANDBOX_URL : process.env.PGKU_PRODUCTION_URL;
  const endpoint = isSandbox ? "sandbox/payment/detail" : "production/payment/detail";

  // 1. Ambil transaksi VIP yang masih Pending dan memiliki reference di Payment Gateway (maks 50 data, 3 hari terakhir)
  const pendingVIP = await db.query(`
    SELECT id, id_user, bukti_bayar_url, price, create_at 
    FROM "history_reseller_plan"
    WHERE status_pembayaran = 'Pending' 
      AND bukti_bayar_url IS NOT NULL
      AND create_at > NOW() - INTERVAL '3 days'
    ORDER BY create_at DESC
    LIMIT 50
  `);

  const results: any[] = [];
  let successCount = 0;
  let expiredCount = 0;
  let skippedCount = 0;

  for (const item of pendingVIP.rows) {
    const reference = item.bukti_bayar_url;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${baseUrl}/${endpoint}?reference=${encodeURIComponent(reference)}`, {
        method: "GET",
        headers: {
          api_key: process.env.PGKU_API_KEY!,
          kode_api: process.env.PGKU_KODE_API!,
        },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await res.json();

      if (json.success && json.data) {
        const status = String(json.data.status || "").toUpperCase();

        if (status === "PAID" || status === "SUCCESS" || status === "SETTLED" || status === "COMPLETED") {
          await markPlanPaymentSuccess(item.id, reference);
          successCount++;
          results.push({ id: item.id, reference, status: "SUCCESS_UPDATED" });
        } else if (status === "EXPIRED" || status === "CANCELLED" || status === "FAILED") {
          await db.query(
            `UPDATE "history_reseller_plan" SET status_pembayaran = 'Expired', update_at = NOW() WHERE id = $1`,
            [item.id]
          );
          expiredCount++;
          results.push({ id: item.id, reference, status: "EXPIRED_UPDATED" });
        } else {
          skippedCount++;
          results.push({ id: item.id, reference, status: `PENDING_NO_CHANGE (${status})` });
        }
      } else {
        skippedCount++;
        results.push({ id: item.id, reference, status: "GATEWAY_ERROR", message: json.message });
      }
    } catch (err: any) {
      skippedCount++;
      results.push({ id: item.id, reference, status: "TIMEOUT_OR_FAILED", error: err.message });
    }
  }

  return {
    success: true,
    job: "payment_gateway_sync",
    timestamp: new Date().toISOString(),
    execution_time_ms: Date.now() - startTime,
    summary: {
      total_checked: pendingVIP.rows.length,
      updated_to_success: successCount,
      updated_to_expired: expiredCount,
      skipped_or_pending: skippedCount,
    },
    results,
  };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
  }

  try {
    const report = await handleSyncPaymentGateway();
    return NextResponse.json(report);
  } catch (err: any) {
    console.error("Cron Payment Gateway Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
