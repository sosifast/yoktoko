"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { triggerPusherEvent } from "@/lib/pusher-server";

export async function getTrxReseller(limit = 200) {
  const result = await db.query(`
    SELECT 
      tr.*,
      u.username as user_username,
      COALESCE(
        (
          SELECT string_agg(p.nama_produk, ', ')
          FROM "Produk" p
          WHERE p.id::text = ANY(string_to_array(tr.id_produk, ','))
        ),
        'Produk Reseller'
      ) as produk_name,
      COALESCE(
        (
          SELECT string_agg(p.nama_produk, ', ')
          FROM "Produk" p
          WHERE p.id::text = ANY(string_to_array(tr.id_produk, ','))
        ),
        'Produk Reseller'
      ) as nama_produk,
      g.name as game_name
    FROM "transaksi_reseller" tr
    LEFT JOIN "User" u ON tr.id_user = u.id::text
    LEFT JOIN "Game" g ON tr.id_game = g.id::text
    ORDER BY tr.create_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

export async function updateTrxResellerStatus(
  id: string, 
  data: { 
    status_pembayaran?: string; 
    status_transaksi?: string;
    kode_server_join?: string;
    bukti_transaksi_url?: string;
  }
) {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (data.status_pembayaran !== undefined) {
    updates.push(`status_pembayaran = $${paramIdx++}`);
    params.push(data.status_pembayaran);
  }
  if (data.status_transaksi !== undefined) {
    updates.push(`status_transaksi = $${paramIdx++}`);
    params.push(data.status_transaksi);
  }
  if (data.kode_server_join !== undefined) {
    updates.push(`kode_server_join = $${paramIdx++}`);
    params.push(data.kode_server_join);
  }
  if (data.bukti_transaksi_url !== undefined) {
    updates.push(`bukti_transaksi_url = $${paramIdx++}`);
    params.push(data.bukti_transaksi_url);
  }

  if (updates.length === 0) return;

  updates.push(`update_at = CURRENT_TIMESTAMP`);
  params.push(id);
  
  const query = `UPDATE "transaksi_reseller" SET ${updates.join(", ")} WHERE id = $${paramIdx}`;
  await db.query(query, params);

  // Broadcast realtime update to Pusher
  try {
    const updatedRes = await db.query(`
      SELECT 
        tr.*,
        u.username as user_username,
        COALESCE(
          (
            SELECT string_agg(p.nama_produk, ', ')
            FROM "Produk" p
            WHERE p.id::text = ANY(string_to_array(tr.id_produk, ','))
          ),
          'Produk Reseller'
        ) as nama_produk,
        COALESCE(
          (
            SELECT string_agg(p.nama_produk, ', ')
            FROM "Produk" p
            WHERE p.id::text = ANY(string_to_array(tr.id_produk, ','))
          ),
          'Produk Reseller'
        ) as produk_name,
        g.name as game_name
      FROM "transaksi_reseller" tr
      LEFT JOIN "User" u ON tr.id_user = u.id::text
      LEFT JOIN "Game" g ON tr.id_game = g.id::text
      WHERE tr.id = $1
    `, [id]);

    if (updatedRes.rows.length > 0) {
      await triggerPusherEvent("reseller-transactions", "reseller-trx-updated", updatedRes.rows[0]);
    }
  } catch (err) {
    console.warn("Pusher trigger error on updateTrxResellerStatus:", err);
  }

  revalidatePath("/owner/trx-seller");
  revalidatePath("/reseller/transaksi");
  revalidatePath("/reseller/dashboard");
}

export async function deleteTrxReseller(id: string) {
  await db.query('DELETE FROM "transaksi_reseller" WHERE id = $1', [id]);
  
  try {
    await triggerPusherEvent("reseller-transactions", "reseller-trx-deleted", { id });
  } catch (err) {
    console.warn("Pusher trigger error on deleteTrxReseller:", err);
  }

  revalidatePath("/owner/trx-seller");
  revalidatePath("/reseller/transaksi");
  revalidatePath("/reseller/dashboard");
}
