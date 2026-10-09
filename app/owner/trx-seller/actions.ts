"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getTrxReseller(limit = 200) {
  const result = await db.query(`
    SELECT 
      tr.*,
      u.username as user_username,
      p.nama_produk as produk_name,
      g.name as game_name
    FROM "transaksi_reseller" tr
    LEFT JOIN "User" u ON tr.id_user = u.id::text
    LEFT JOIN "Produk" p ON tr.id_produk = p.id::text
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
  revalidatePath("/owner/trx-seller");
}

export async function deleteTrxReseller(id: string) {
  await db.query('DELETE FROM "transaksi_reseller" WHERE id = $1', [id]);
  revalidatePath("/owner/trx-seller");
}
