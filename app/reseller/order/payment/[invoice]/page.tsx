import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserById } from "@/app/owner/user/actions";
import { db } from "@/lib/db";
import PaymentClient from "./PaymentClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ invoice: string }>;
  searchParams: Promise<{ all?: string }>;
}

export default async function OrderPaymentPage({ params, searchParams }: PageProps) {
  const { invoice } = await params;
  const { all } = await searchParams;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    redirect("/login");
  }

  const user = await getUserById(sessionToken);
  if (!user || !user.id) {
    redirect("/login");
  }

  // Siapkan daftar invoice yang akan dicari (support multiple items jika ada query 'all')
  const invoiceList: string[] = [invoice];
  if (all) {
    all.split(",").forEach((inv) => {
      const trimmed = inv.trim();
      if (trimmed && !invoiceList.includes(trimmed)) {
        invoiceList.push(trimmed);
      }
    });
  }

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
      tr.create_at,
      COALESCE(
        (
          SELECT string_agg(p.nama_produk, ', ')
          FROM "Produk" p
          WHERE p.id::text = ANY(string_to_array(tr.id_produk, ','))
        ),
        'Produk Game'
      ) as nama_produk,
      g.name as game_name
    FROM "transaksi_reseller" tr
    LEFT JOIN "Game" g ON tr.id_game = g.id::text
    WHERE tr.invoice = ANY($1) AND tr.id_user = $2
    ORDER BY tr.create_at ASC
  `,
    [invoiceList, user.id]
  );

  if (result.rows.length === 0) {
    notFound();
  }

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
    create_at: row.create_at ? new Date(row.create_at).toISOString() : new Date().toISOString(),
    nama_produk: row.nama_produk || null,
    game_name: row.game_name || null,
  }));

  return <PaymentClient transactions={transactions} primaryInvoice={invoice} />;
}
