import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { triggerPusherEvent } from "@/lib/pusher-server";
import crypto from "crypto";

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

async function handleExpireVIPMemberships() {
  const startTime = Date.now();

  // 1. Ambil semua keanggotaan VIP yang masih aktif tapi masa berlakunya sudah lewat (expired_date < NOW())
  const expiredPlans = await db.query(`
    SELECT h.id, h.id_user, h.id_reseller_plan, h.expired_date, p.paket, u.username, u.level
    FROM "history_reseller_plan" h
    LEFT JOIN "reseller_plan" p ON h.id_reseller_plan::text = p.id::text
    LEFT JOIN "User" u ON h.id_user::text = u.id::text
    WHERE h.is_active = 1 
      AND h.expired_date < NOW()
  `);

  const expiredCount = expiredPlans.rows.length;
  const processedUsers = new Set<string>();
  const downgradedUsers: any[] = [];
  const details: any[] = [];

  for (const plan of expiredPlans.rows) {
    // 2. Nonaktifkan record history ini
    await db.query(
      `UPDATE "history_reseller_plan" 
       SET is_active = 0, update_at = NOW() 
       WHERE id = $1`,
      [plan.id]
    );

    details.push({
      history_id: plan.id,
      user_id: plan.id_user,
      username: plan.username,
      paket: plan.paket,
      expired_at: plan.expired_date,
    });

    // 3. Cek apakah user masih memiliki paket VIP lain yang masih aktif
    if (plan.id_user && !processedUsers.has(plan.id_user)) {
      processedUsers.add(plan.id_user);

      const activeRemaining = await db.query(
        `SELECT COUNT(*) as count 
         FROM "history_reseller_plan" 
         WHERE id_user::text = $1::text 
           AND is_active = 1 
           AND expired_date >= NOW()`,
        [plan.id_user]
      );

      const remainingActiveCount = parseInt(activeRemaining.rows[0]?.count || "0", 10);

      if (remainingActiveCount === 0) {
        // Ambil info user saat ini
        const userRes = await db.query(`SELECT id, username, level FROM "User" WHERE id::text = $1::text`, [plan.id_user]);
        if (userRes.rows.length > 0) {
          const user = userRes.rows[0];
          const userLevel = (user.level || "").toLowerCase();

          // Jangan turunkan level jika user adalah Owner atau Admin
          if (userLevel === "reseller") {
            await db.query(
              `UPDATE "User" SET level = 'Talent', update_at = NOW() WHERE id::text = $1::text`,
              [plan.id_user]
            );

            downgradedUsers.push({
              id: user.id,
              username: user.username,
              previous_level: user.level,
              new_level: "Talent",
            });

            // Buat notifikasi riwayat
            const notifId = crypto.randomUUID();
            await db.query(
              `INSERT INTO "notifikasi" (id, judul, konten, create_at, update_at)
               VALUES ($1, $2, $3, NOW(), NOW())`,
              [
                notifId,
                `Masa Aktif VIP Berakhir - @${user.username}`,
                `Langganan VIP untuk akun @${user.username} telah berakhir pada ${new Date(plan.expired_date).toLocaleDateString("id-ID")}. Level akun disesuaikan kembali menjadi Talent.`,
              ]
            );

            // Trigger realtime event ke frontend user
            try {
              await triggerPusherEvent("reseller-transactions", "vip-plan-expired", {
                id_user: user.id,
                is_active: 0,
                new_level: "Talent",
              });
            } catch (pushErr) {
              console.warn("Pusher warning on vip expire:", pushErr);
            }
          }
        }
      }
    }
  }

  return {
    success: true,
    job: "vip_membership_expiry_check",
    timestamp: new Date().toISOString(),
    execution_time_ms: Date.now() - startTime,
    summary: {
      total_expired_plans: expiredCount,
      users_downgraded_to_talent: downgradedUsers.length,
    },
    downgraded_users: downgradedUsers,
    details,
  };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
  }

  try {
    const report = await handleExpireVIPMemberships();
    return NextResponse.json(report);
  } catch (err: any) {
    console.error("Cron VIP Expiry Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
