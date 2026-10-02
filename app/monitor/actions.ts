"use server";

import { db } from "@/lib/db";

export interface QueueTransaction {
  id: string;
  create_at: string;
  update_at: string;
  id_kategori: string | null;
  id_game: string | null;
  id_suplier: string | null;
  kategori_name: string | null;
  game_name: string | null;
  suplier_name: string | null;
  username_tiktok: string | null;
  username_roblox: string | null;
  harga: number;
  subtotal: number;
  kode_unik: number;
  status: string;
  data_order: any[];
}

export async function getQueueData() {
  // Query all transactions
  const result = await db.query(`
    SELECT t.*, 
           k.name as kategori_name, 
           g.name as game_name, 
           s.name as suplier_name
    FROM "Transaksi" t
    LEFT JOIN "Kategori" k ON t.id_kategori = k.id
    LEFT JOIN "Game" g ON t.id_game = g.id
    LEFT JOIN "Suplier" s ON t.id_suplier = s.id
    ORDER BY t.create_at ASC
  `);

  const all = result.rows.map((row) => {
    let dataOrder: any[] = [];
    try {
      dataOrder = typeof row.data_order === "string" ? JSON.parse(row.data_order) : (row.data_order || []);
    } catch {
      dataOrder = [];
    }
    return {
      ...row,
      harga: Number(row.harga) || 0,
      subtotal: Number(row.subtotal) || 0,
      kode_unik: Number(row.kode_unik) || 0,
      data_order: dataOrder,
    };
  });

  // Active queue: Pending, Bayar, Kirim
  const activeQueue = all.filter((t) =>
    ["pending", "bayar", "kirim"].includes((t.status || "").toLowerCase())
  );

  // Recently finished/cancelled: Selesai, Batal
  const finishedList = all
    .filter((t) => ["selesai", "batal"].includes((t.status || "").toLowerCase()))
    .sort((a, b) => new Date(b.update_at || b.create_at).getTime() - new Date(a.update_at || a.create_at).getTime())
    .slice(0, 10);

  return {
    activeQueue,
    finishedList,
  };
}
