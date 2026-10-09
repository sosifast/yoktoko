"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getResellerPlans() {
  const result = await db.query('SELECT * FROM "reseller_plan" ORDER BY price ASC');
  return result.rows;
}

export async function getHistoryReseller(userId: string) {
  // Wait, without auth context we might just show all history for now
  // Or fetch by userId if passed
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
  await db.query(
    'INSERT INTO "reseller_plan" (id, paket, price, durasi) VALUES (gen_random_uuid(), $1, $2, $3)',
    [data.paket, data.price, data.durasi]
  );
  revalidatePath("/plan-reseller/plan");
}

export async function updateResellerPlan(id: string, data: { paket: string; price: number; durasi: number }) {
  await db.query(
    'UPDATE "reseller_plan" SET paket = $1, price = $2, durasi = $3 WHERE id = $4',
    [data.paket, data.price, data.durasi, id]
  );
  revalidatePath("/plan-reseller/plan");
}

export async function deleteResellerPlan(id: string) {
  await db.query('DELETE FROM "reseller_plan" WHERE id = $1', [id]);
  revalidatePath("/plan-reseller/plan");
}

export async function purchaseResellerPlan(planId: string, userId: string, price: number, durasi: number) {
  const start_date = new Date();
  const expired_date = new Date();
  expired_date.setDate(expired_date.getDate() + durasi);

  await db.query(
    `INSERT INTO "history_reseller_plan" 
      (id, id_reseller_plan, id_user, price, start_date, expired_date, status_pembayaran, is_active)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)`,
    [planId, userId, price, start_date, expired_date, "Pending", 0]
  );
  
  revalidatePath("/plan-reseller/history");
}
