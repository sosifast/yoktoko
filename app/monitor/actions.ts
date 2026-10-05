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
  const [activeResult, finishedResult] = await Promise.all([
    // Active transactions in queue (Pending, Pay, Kirim)
    db.query(`
      SELECT t.id, t.create_at, t.update_at, t.id_kategori, t.id_game, t.id_suplier,
             t.username_tiktok, t.username_roblox, t.harga, t.subtotal, t.kode_unik,
             t.status, t.data_order,
             k.name as kategori_name, 
             g.name as game_name, 
             s.name as suplier_name
      FROM "Transaksi" t
      LEFT JOIN "Kategori" k ON t.id_kategori = k.id
      LEFT JOIN "Game" g ON t.id_game = g.id
      LEFT JOIN "Suplier" s ON t.id_suplier = s.id
      WHERE LOWER(t.status) IN ('pending', 'bayar', 'kirim')
      ORDER BY t.create_at ASC
    `),
    // Recent finished / cancelled for popup trigger detection
    db.query(`
      SELECT t.id, t.create_at, t.update_at, t.status,
             t.username_tiktok, t.username_roblox
      FROM "Transaksi" t
      WHERE LOWER(t.status) IN ('selesai', 'batal')
      ORDER BY t.update_at DESC
      LIMIT 30
    `),
  ]);

  const activeQueue = activeResult.rows.map((row) => {
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

  return {
    activeQueue,
    finishedList: finishedResult.rows,
  };
}
