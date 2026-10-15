"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-guard";
import { sanitizeString } from "@/lib/security";

export async function getResellerPlans() {
  const result = await db.query('SELECT * FROM "reseller_plan" ORDER BY price ASC');
  return result.rows;
}

export async function getHistoryReseller(userId: string) {
  const query = userId 
    ? 'SELECT h.*, p.paket, p.durasi FROM "history_reseller_plan" h JOIN "reseller_plan" p ON h.id_reseller_plan::text = p.id::text WHERE h.id_user::text = $1::text ORDER BY h.create_at DESC'
    : 'SELECT h.*, p.paket, p.durasi, u.username FROM "history_reseller_plan" h JOIN "reseller_plan" p ON h.id_reseller_plan::text = p.id::text JOIN "User" u ON h.id_user::text = u.id::text ORDER BY h.create_at DESC';
  
  const result = userId ? await db.query(query, [userId]) : await db.query(query);
  return result.rows;
}

export async function getResellerPlanById(id: string) {
  const result = await db.query('SELECT * FROM "reseller_plan" WHERE id = $1', [id]);
  return result.rows[0];
}

export async function createResellerPlan(data: { paket: string; price: number; durasi: number }) {
  await requireOwner();
  const paket = sanitizeString(data.paket, 50);
  await db.query(
    'INSERT INTO "reseller_plan" (id, paket, price, durasi) VALUES (gen_random_uuid(), $1, $2, $3)',
    [paket, Math.max(0, Number(data.price)), Math.max(1, Number(data.durasi))]
  );
  revalidatePath("/plan-reseller/plan");
  revalidatePath("/owner/plan-reseller");
}

export async function updateResellerPlan(id: string, data: { paket: string; price: number; durasi: number }) {
  await requireOwner();
  const paket = sanitizeString(data.paket, 50);
  await db.query(
    'UPDATE "reseller_plan" SET paket = $1, price = $2, durasi = $3 WHERE id = $4',
    [paket, Math.max(0, Number(data.price)), Math.max(1, Number(data.durasi)), id]
  );
  revalidatePath("/plan-reseller/plan");
  revalidatePath("/owner/plan-reseller");
}

export async function deleteResellerPlan(id: string) {
  await requireOwner();
  await db.query('DELETE FROM "reseller_plan" WHERE id = $1', [id]);
  revalidatePath("/plan-reseller/plan");
  revalidatePath("/owner/plan-reseller");
}

export async function updateStatusManualResellerPlan(historyId: string, status: "Sukses" | "Batal") {
  await requireOwner();
  if (status === "Sukses") {
    const { markPlanPaymentSuccess } = await import("@/lib/payment-service");
    await markPlanPaymentSuccess(historyId);
  } else {
    await db.query(
      `UPDATE "history_reseller_plan"
       SET status_pembayaran = 'Batal', is_active = 0, update_at = NOW()
       WHERE id = $1`,
      [historyId]
    );

    try {
      const planRes = await db.query(`SELECT id_user FROM "history_reseller_plan" WHERE id = $1`, [historyId]);
      if (planRes.rows.length > 0) {
        const { triggerPusherEvent } = await import("@/lib/pusher-server");
        await triggerPusherEvent("reseller-transactions", "vip-plan-updated", {
          id_user: planRes.rows[0].id_user,
          is_active: 0,
        });
      }
    } catch (pushErr) {
      console.warn("Pusher trigger error on updateStatusManualResellerPlan:", pushErr);
    }
  }
  revalidatePath("/owner/plan-reseller/history");
  revalidatePath("/owner/dashboard");
  revalidatePath("/reseller/dashboard");
  revalidatePath("/reseller/vip/history");
}
