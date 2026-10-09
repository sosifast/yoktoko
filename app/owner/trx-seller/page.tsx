"use client";

import { useState, useEffect } from "react";
import { getTrxReseller, updateTrxResellerStatus, deleteTrxReseller } from "./actions";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "@/app/components/Sidebar";

export default function TrxResellerPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [editModalTrx, setEditModalTrx] = useState<any | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  // Form State for Edit
  const [editStatusPembayaran, setEditStatusPembayaran] = useState("");
  const [editStatusTransaksi, setEditStatusTransaksi] = useState("");
  const [editKodeServer, setEditKodeServer] = useState("");
  const [editBuktiTrxUrl, setEditBuktiTrxUrl] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTrxReseller();
      setTransactions(data);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = transactions.filter((t) => 
    (t.invoice || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.user_username || "").toLowerCase().includes(search.toLowerCase())
  );

  const openEditModal = (trx: any) => {
    setEditModalTrx(trx);
    setEditStatusPembayaran(trx.status_pembayaran || "Pending");
    setEditStatusTransaksi(trx.status_transaksi || "Pending");
    setEditKodeServer(trx.kode_server_join || "");
    setEditBuktiTrxUrl(trx.bukti_transaksi_url || "");
  };

  const handleUpdate = async () => {
    if (!editModalTrx) return;
    try {
      await updateTrxResellerStatus(editModalTrx.id, {
        status_pembayaran: editStatusPembayaran,
        status_transaksi: editStatusTransaksi,
        kode_server_join: editKodeServer,
        bukti_transaksi_url: editBuktiTrxUrl
      });
      toast.success("Transaksi berhasil diupdate");
      setEditModalTrx(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Gagal update transaksi");
    }
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;
    try {
      await deleteTrxReseller(deleteModalId);
      toast.success("Transaksi berhasil dihapus");
      setDeleteModalId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus transaksi");
    }
  };

  return (
    <Sidebar>
      <div className="min-h-screen bg-[#1a1a1a] p-6 text-white">
        <Toaster position="top-center" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#FECB2F]">Transaksi Reseller</h1>
          <p className="text-sm text-zinc-400">Kelola data transaksi dari reseller</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Cari invoice / user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-xl border border-white/10 bg-[#222] px-4 py-2 text-sm text-white focus:border-[#FECB2F] outline-none"
          />
          <button onClick={loadData} className="bg-[#333] hover:bg-[#444] rounded-xl px-4 py-2 transition">
            <i className="fa-solid fa-rotate-right text-zinc-300"></i>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#222222] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a1a1a] text-xs uppercase text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Invoice / User</th>
                <th className="px-6 py-4 font-semibold">Game / Produk</th>
                <th className="px-6 py-4 font-semibold">Roblox User</th>
                <th className="px-6 py-4 font-semibold">Total Harga</th>
                <th className="px-6 py-4 font-semibold">Status Bayar</th>
                <th className="px-6 py-4 font-semibold">Status Trx</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">Data tidak ditemukan</td>
                </tr>
              ) : (
                filtered.map((trx) => (
                  <tr key={trx.id} className="hover:bg-[#2a2a2a] transition">
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#FECB2F] block">{trx.invoice}</span>
                      <span className="text-zinc-400 text-xs">{trx.user_username || trx.id_user}</span>
                      <div className="text-[10px] text-zinc-600 mt-1">
                        {new Date(trx.create_at).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white block">{trx.produk_name}</span>
                      <span className="text-zinc-400 text-xs">{trx.game_name}</span>
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-medium">
                      {trx.username_roblox || "-"}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      Rp {Number(trx.price).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trx.status_pembayaran === "Sukses" ? "bg-emerald-500/20 text-emerald-400" : 
                        trx.status_pembayaran === "Pending" ? "bg-amber-500/20 text-amber-400" : 
                        trx.status_pembayaran === "Cek Pembayaran" ? "bg-blue-500/20 text-blue-400" : 
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {trx.status_pembayaran}
                      </span>
                      {trx.bukti_status_pembayaran_url && (
                        <a href={trx.bukti_status_pembayaran_url} target="_blank" rel="noreferrer" className="block mt-2 text-[10px] text-blue-400 hover:underline">
                          <i className="fa-solid fa-link"></i> Bukti Bayar
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trx.status_transaksi === "Selesai" ? "bg-emerald-500/20 text-emerald-400" : 
                        trx.status_transaksi === "Pending" ? "bg-amber-500/20 text-amber-400" : 
                        trx.status_transaksi === "Dikirim" ? "bg-blue-500/20 text-blue-400" : 
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {trx.status_transaksi}
                      </span>
                      {trx.kode_server_join && (
                        <span className="block mt-2 text-[10px] text-zinc-400">
                          Kode: {trx.kode_server_join}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => openEditModal(trx)}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                          title="Edit Transaksi"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button
                          onClick={() => setDeleteModalId(trx.id)}
                          className="text-red-500 hover:text-red-400 font-semibold"
                          title="Hapus"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#222222] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-4">
              <h3 className="text-lg font-bold text-white">Update Transaksi</h3>
              <button
                onClick={() => setEditModalTrx(null)}
                className="text-zinc-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Status Pembayaran</label>
                <select
                  value={editStatusPembayaran}
                  onChange={(e) => setEditStatusPembayaran(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-[#FECB2F]"
                >
                  <option value="Pending">Pending</option>
                  <option value="Bayar">Bayar</option>
                  <option value="Cek Pembayaran">Cek Pembayaran</option>
                  <option value="Sukses">Sukses</option>
                  <option value="Batal">Batal</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Status Transaksi</label>
                <select
                  value={editStatusTransaksi}
                  onChange={(e) => setEditStatusTransaksi(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-[#FECB2F]"
                >
                  <option value="Pending">Pending</option>
                  <option value="Dikirim">Dikirim</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Batal">Batal</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Kode Server Join (Opsional)</label>
                <input
                  type="text"
                  value={editKodeServer}
                  onChange={(e) => setEditKodeServer(e.target.value)}
                  placeholder="Contoh: XyZ123"
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-[#FECB2F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Bukti Transaksi URL (Opsional)</label>
                <input
                  type="text"
                  value={editBuktiTrxUrl}
                  onChange={(e) => setEditBuktiTrxUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-[#FECB2F]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditModalTrx(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-400 hover:bg-[#333] hover:text-white transition"
              >
                Batal
              </button>
              <button
                onClick={handleUpdate}
                className="rounded-xl bg-[#FECB2F] px-4 py-2 text-sm font-bold text-black hover:bg-[#ffdf70] transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#222222] p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <i className="fa-solid fa-triangle-exclamation text-xl text-red-500"></i>
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">Hapus Transaksi?</h3>
            <p className="mb-6 text-sm text-zinc-400">
              Data transaksi ini akan dihapus permanen. Anda yakin?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalId(null)}
                className="flex-1 rounded-xl bg-[#333] py-2.5 text-sm font-bold text-white hover:bg-[#444] transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Sidebar>
  );
}
