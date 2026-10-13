import { db } from "@/lib/db";
import { triggerPusherEvent } from "@/lib/pusher-server";

/**
 * Update history_reseller_plan dan level user menjadi reseller ketika pembayaran sukses
 */
export async function markPlanPaymentSuccess(merchantRef: string, reference?: string) {
  try {
    // 1. Ambil data history transaksi berdasarkan merchantRef (ID history) atau reference (bukti_bayar_url)
    const historyCheck = await db.query(
      `SELECT h.*, p.durasi 
       FROM "history_reseller_plan" h
       LEFT JOIN "reseller_plan" p ON h.id_reseller_plan = p.id
       WHERE h.id = $1 OR (h.bukti_bayar_url IS NOT NULL AND (h.bukti_bayar_url = $1 OR h.bukti_bayar_url = $2))
       LIMIT 1`,
      [merchantRef, reference || merchantRef]
    );

    if (historyCheck.rows.length === 0) {
      console.warn(`[Payment] Transaksi history ${merchantRef} (ref: ${reference}) tidak ditemukan`);
      return false;
    }

    const history = historyCheck.rows[0];

    // Jika sudah sukses/aktif, tidak perlu update lagi
    if (history.status_pembayaran === "Success" && history.is_active === 1) {
      return true;
    }

    // 2. Hitung start_date dan expired_date baru dari saat pembayaran sukses
    const durasiHari = history.durasi || 30;
    const startDate = new Date();
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + durasiHari);

    // 3. Update status pembayaran dan aktifkan paket
    // Catatan: Jika ada kolom bukti_bayar_url atau referensi PG, simpan jika ada
    await db.query(
      `UPDATE "history_reseller_plan"
       SET status_pembayaran = 'Success',
           is_active = 1,
           start_date = $1,
           expired_date = $2,
           bukti_bayar_url = COALESCE($3, bukti_bayar_url),
           update_at = NOW()
       WHERE id = $4`,
      [startDate, expiredDate, reference || null, history.id]
    );

    // 4. Update level user ke 'reseller' jika masih level biasa
    if (history.id_user) {
      await db.query(
        `UPDATE "User"
         SET level = 'reseller',
             update_at = NOW()
         WHERE id::text = $1::text`,
        [history.id_user]
      );
    }

    try {
      await triggerPusherEvent("reseller-transactions", "vip-plan-updated", {
        id_user: history.id_user,
        is_active: 1,
        expired_date: expiredDate,
      });
    } catch (pushErr) {
      console.warn("Pusher trigger error on markPlanPaymentSuccess:", pushErr);
    }

    console.log(`[Payment] Berhasil mengaktifkan VIP plan untuk history ID: ${history.id}`);
    return true;
  } catch (error) {
    console.error(`[Payment] Gagal update pembayaran sukses untuk ${merchantRef}:`, error);
    return false;
  }
}
