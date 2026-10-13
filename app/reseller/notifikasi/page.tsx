import { db } from "@/lib/db";
import NotifikasiClient, { NotifikasiItem } from "./NotifikasiClient";

export const dynamic = "force-dynamic";

export default async function NotifikasiResellerPage() {
  let notifications: NotifikasiItem[] = [];

  try {
    const res = await db.query(`
      SELECT id, judul, konten, create_at, update_at
      FROM "notifikasi"
      ORDER BY create_at DESC
      LIMIT 50
    `);

    notifications = res.rows.map((row: any) => ({
      id: String(row.id),
      judul: String(row.judul),
      konten: String(row.konten),
      create_at: row.create_at ? new Date(row.create_at).toISOString() : new Date().toISOString(),
      update_at: row.update_at ? new Date(row.update_at).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching notifications for reseller:", error);
  }

  return <NotifikasiClient initialNotifications={notifications} />;
}
