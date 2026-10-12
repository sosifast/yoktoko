import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";
import { db } from "@/lib/db";
import TransaksiClient from "./TransaksiClient";

export const dynamic = "force-dynamic";

export default async function TransaksiPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return (
      <div className="p-8 text-center text-gray-500">
        Silakan login terlebih dahulu untuk melihat riwayat transaksi.
      </div>
    );
  }

  const user = await getUserById(sessionToken);
  if (!user || !user.id) {
    return (
      <div className="p-8 text-center text-gray-500">
        Akun tidak valid atau sesi berakhir. Silakan login kembali.
      </div>
    );
  }

  // Fetch real transactions for the logged-in user from transaksi_reseller
  const result = await db.query(
    `
    SELECT 
      tr.id,
      tr.invoice,
      tr.id_produk,
      tr.id_game,
      tr.price,
      tr.status_pembayaran,
      tr.bukti_status_pembayaran_url,
      tr.username_roblox,
      tr.status_transaksi,
      tr.kode_server_join,
      tr.bukti_transaksi_url,
      tr.create_at,
      p.nama_produk,
      g.name as game_name
    FROM "transaksi_reseller" tr
    LEFT JOIN "Produk" p ON tr.id_produk = p.id::text
    LEFT JOIN "Game" g ON tr.id_game = g.id::text
    WHERE tr.id_user = $1
    ORDER BY tr.create_at DESC
    LIMIT 100
  `,
    [user.id]
  );

  const transactions = result.rows.map((row: any) => ({
    id: String(row.id),
    invoice: String(row.invoice),
    id_produk: String(row.id_produk),
    id_game: String(row.id_game),
    price: Number(row.price || 0),
    status_pembayaran: String(row.status_pembayaran || "Pending"),
    bukti_status_pembayaran_url: row.bukti_status_pembayaran_url || null,
    username_roblox: row.username_roblox || null,
    status_transaksi: String(row.status_transaksi || "Pending"),
    kode_server_join: row.kode_server_join || null,
    bukti_transaksi_url: row.bukti_transaksi_url || null,
    create_at: row.create_at ? new Date(row.create_at).toISOString() : new Date().toISOString(),
    nama_produk: row.nama_produk || null,
    game_name: row.game_name || null,
  }));

  return <TransaksiClient transactions={transactions} />;
}
