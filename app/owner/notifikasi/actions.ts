"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { triggerPusherEvent } from "@/lib/pusher-server";
import { randomUUID } from "crypto";

export interface NotifikasiItem {
  id: string;
  judul: string;
  konten: string;
  create_at: string;
  update_at: string;
}

export async function getNotifikasi(): Promise<NotifikasiItem[]> {
  try {
    const res = await db.query(`
      SELECT id, judul, konten, create_at, update_at
      FROM "notifikasi"
      ORDER BY create_at DESC
    `);

    return res.rows.map((row: any) => ({
      id: String(row.id),
      judul: String(row.judul),
      konten: String(row.konten),
      create_at: row.create_at ? new Date(row.create_at).toISOString() : new Date().toISOString(),
      update_at: row.update_at ? new Date(row.update_at).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error getNotifikasi:", error);
    return [];
  }
}

export async function createNotifikasi(data: { judul: string; konten: string }) {
  const judul = data.judul?.trim();
  const konten = data.konten?.trim();

  if (!judul || !konten) {
    return { success: false, error: "Judul dan konten notifikasi wajib diisi." };
  }

  try {
    const id = randomUUID();
    const res = await db.query(
      `
      INSERT INTO "notifikasi" (id, judul, konten, create_at, update_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, judul, konten, create_at, update_at
    `,
      [id, judul, konten]
    );

    const newNotif = {
      id: String(res.rows[0].id),
      judul: String(res.rows[0].judul),
      konten: String(res.rows[0].konten),
      create_at: new Date(res.rows[0].create_at).toISOString(),
      update_at: new Date(res.rows[0].update_at).toISOString(),
    };

    // Broadcast ke Pusher untuk realtime update reseller
    try {
      await triggerPusherEvent("reseller-notifications", "notification-created", newNotif);
    } catch (pushErr) {
      console.warn("Pusher broadcast error createNotifikasi:", pushErr);
    }

    revalidatePath("/owner/notifikasi");
    revalidatePath("/reseller/notifikasi");
    revalidatePath("/reseller/dashboard");

    return { success: true, data: newNotif };
  } catch (error: any) {
    console.error("Error createNotifikasi:", error);
    return { success: false, error: error.message || "Gagal membuat notifikasi." };
  }
}

export async function updateNotifikasi(id: string, data: { judul: string; konten: string }) {
  const judul = data.judul?.trim();
  const konten = data.konten?.trim();

  if (!id || !judul || !konten) {
    return { success: false, error: "Data notifikasi tidak lengkap." };
  }

  try {
    const res = await db.query(
      `
      UPDATE "notifikasi"
      SET judul = $1, konten = $2, update_at = NOW()
      WHERE id = $3
      RETURNING id, judul, konten, create_at, update_at
    `,
      [judul, konten, id]
    );

    if (res.rows.length === 0) {
      return { success: false, error: "Notifikasi tidak ditemukan." };
    }

    const updatedNotif = {
      id: String(res.rows[0].id),
      judul: String(res.rows[0].judul),
      konten: String(res.rows[0].konten),
      create_at: new Date(res.rows[0].create_at).toISOString(),
      update_at: new Date(res.rows[0].update_at).toISOString(),
    };

    // Broadcast ke Pusher
    try {
      await triggerPusherEvent("reseller-notifications", "notification-updated", updatedNotif);
    } catch (pushErr) {
      console.warn("Pusher broadcast error updateNotifikasi:", pushErr);
    }

    revalidatePath("/owner/notifikasi");
    revalidatePath("/reseller/notifikasi");
    revalidatePath("/reseller/dashboard");

    return { success: true, data: updatedNotif };
  } catch (error: any) {
    console.error("Error updateNotifikasi:", error);
    return { success: false, error: error.message || "Gagal mengupdate notifikasi." };
  }
}

export async function deleteNotifikasi(id: string) {
  if (!id) {
    return { success: false, error: "ID notifikasi tidak valid." };
  }

  try {
    await db.query(`DELETE FROM "notifikasi" WHERE id = $1`, [id]);

    // Broadcast ke Pusher
    try {
      await triggerPusherEvent("reseller-notifications", "notification-deleted", { id });
    } catch (pushErr) {
      console.warn("Pusher broadcast error deleteNotifikasi:", pushErr);
    }

    revalidatePath("/owner/notifikasi");
    revalidatePath("/reseller/notifikasi");
    revalidatePath("/reseller/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleteNotifikasi:", error);
    return { success: false, error: error.message || "Gagal menghapus notifikasi." };
  }
}
