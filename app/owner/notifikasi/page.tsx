"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import toast, { Toaster } from "react-hot-toast";
import { getPusherClient } from "@/lib/pusher-client";
import {
  getNotifikasi,
  createNotifikasi,
  updateNotifikasi,
  deleteNotifikasi,
  NotifikasiItem,
} from "./actions";

export default function NotifikasiOwnerPage() {
  const [notifications, setNotifications] = useState<NotifikasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NotifikasiItem | null>(null);
  const [formData, setFormData] = useState({ judul: "", konten: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getNotifikasi();
      setNotifications(data);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Pusher realtime subscription
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("reseller-notifications");

    channel.bind("notification-created", () => {
      loadData();
    });

    channel.bind("notification-updated", () => {
      loadData();
    });

    channel.bind("notification-deleted", () => {
      loadData();
    });

    return () => {
      channel.unbind("notification-created");
      channel.unbind("notification-updated");
      channel.unbind("notification-deleted");
      pusher.unsubscribe("reseller-notifications");
    };
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ judul: "", konten: "" });
    setShowModal(true);
  };

  const openEditModal = (item: NotifikasiItem) => {
    setEditingItem(item);
    setFormData({ judul: item.judul, konten: item.konten });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.konten.trim()) {
      toast.error("Judul dan konten wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const res = await updateNotifikasi(editingItem.id, formData);
        if (res.success) {
          toast.success("Notifikasi berhasil diperbarui & dibroadcast!");
          setShowModal(false);
          loadData();
        } else {
          toast.error(res.error || "Gagal memperbarui notifikasi");
        }
      } else {
        const res = await createNotifikasi(formData);
        if (res.success) {
          toast.success("Notifikasi berhasil dikirim ke seluruh reseller!");
          setShowModal(false);
          loadData();
        } else {
          toast.error(res.error || "Gagal mengirim notifikasi");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;
    setIsDeleting(true);
    try {
      const res = await deleteNotifikasi(deleteModalId);
      if (res.success) {
        toast.success("Notifikasi berhasil dihapus");
        setDeleteModalId(null);
        loadData();
      } else {
        toast.error(res.error || "Gagal menghapus notifikasi");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = notifications.filter(
    (n) =>
      n.judul.toLowerCase().includes(search.toLowerCase()) ||
      n.konten.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sidebar>
      <div className="min-h-screen bg-[#1a1a1a] p-6 text-white">
        <Toaster position="top-center" />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#FECB2F] flex items-center gap-2.5">
              <i className="fa-solid fa-bell"></i>
              Kelola Notifikasi Reseller
            </h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Kirim pengumuman, info maintenance, atau update ke seluruh reseller secara realtime
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Cari notifikasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 rounded-xl border border-white/10 bg-[#222] px-4 py-2.5 text-sm text-white focus:border-[#FECB2F] outline-none"
            />
            <button
              onClick={loadData}
              className="bg-[#2a2a2a] hover:bg-[#333] border border-white/10 rounded-xl px-4 py-2.5 transition text-zinc-300"
              title="Refresh Data"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>
            <button
              onClick={openCreateModal}
              className="bg-[#FECB2F] hover:bg-[#e5b62a] text-[#222] font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-[0_0_15px_-3px_#FECB2F] shrink-0 transition"
            >
              <i className="fa-solid fa-plus text-xs"></i> Buat Notifikasi
            </button>
          </div>
        </div>

        {/* Notification Table */}
        <div className="rounded-2xl border border-white/10 bg-[#222222] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1a1a1a] text-xs uppercase text-zinc-400 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold">Judul</th>
                  <th className="px-6 py-4 font-semibold">Konten Pengumuman</th>
                  <th className="px-6 py-4 font-semibold">Waktu Dibuat</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      <i className="fa-solid fa-spinner fa-spin text-2xl mb-2 block text-[#FECB2F]"></i>
                      Memuat notifikasi...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      <i className="fa-regular fa-bell-slash text-3xl mb-2 block opacity-40"></i>
                      Belum ada notifikasi yang dibuat.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const dateFormatted = new Date(item.create_at).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4 align-top">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#FECB2F] inline-block shrink-0"></span>
                            {item.judul}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="text-zinc-300 text-xs line-clamp-2 max-w-lg whitespace-pre-line">
                            {item.konten}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top whitespace-nowrap text-xs text-zinc-400">
                          {dateFormatted}
                        </td>
                        <td className="px-6 py-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <i className="fa-solid fa-pen-to-square text-xs"></i> Edit
                            </button>
                            <button
                              onClick={() => setDeleteModalId(item.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <i className="fa-solid fa-trash text-xs"></i> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => !isSubmitting && setShowModal(false)}
          >
            <div
              className="bg-[#222222] rounded-2xl p-6 max-w-lg w-full border border-white/10 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <i className="fa-solid fa-bullhorn text-[#FECB2F]"></i>
                  {editingItem ? "Edit Notifikasi" : "Buat Notifikasi Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-semibold mb-1.5 block">
                    Judul Notifikasi
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Info Maintenance Server Roblox"
                    value={formData.judul}
                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white focus:border-[#FECB2F] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-semibold mb-1.5 block">
                    Konten / Isi Pengumuman
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tuliskan isi pesan notifikasi yang akan dibaca oleh reseller..."
                    value={formData.konten}
                    onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] p-3 text-sm text-white focus:border-[#FECB2F] outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#FECB2F] hover:bg-[#e5b62a] text-[#222] text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_-3px_#FECB2F] transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane text-xs"></i>
                        {editingItem ? "Simpan Perubahan" : "Broadcast Sekarang"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalId && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteModalId(null)}
          >
            <div
              className="bg-[#222222] rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-trash text-xl"></i>
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Hapus Notifikasi?</h3>
              <p className="text-xs text-zinc-400 mb-6">
                Notifikasi ini akan dihapus permanen dan tidak akan terlihat lagi oleh reseller.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModalId(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
