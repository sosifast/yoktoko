"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { getPusherClient } from "@/lib/pusher-client";

interface TransaksiItem {
  id: string;
  invoice: string;
  id_produk: string;
  id_game: string;
  price: number;
  status_pembayaran: string;
  bukti_status_pembayaran_url?: string | null;
  username_roblox?: string | null;
  status_transaksi: string;
  kode_server_join?: string | null;
  bukti_transaksi_url?: string | null;
  create_at: string;
  nama_produk?: string | null;
  game_name?: string | null;
}

export default function TransaksiClient({ transactions }: { transactions: TransaksiItem[] }) {
  const router = useRouter();
  const [trxList, setTrxList] = useState<TransaksiItem[]>(transactions);
  const [filter, setFilter] = useState<"all" | "proses" | "selesai" | "gagal">("all");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync if props change
  useEffect(() => {
    setTrxList(transactions);
  }, [transactions]);

  // Realtime subscription via Pusher
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("reseller-transactions");

    const handleCreated = (newTrx: any) => {
      if (!newTrx) return;
      setTrxList((prev) => {
        if (prev.some((t) => t.id === String(newTrx.id) || t.invoice === String(newTrx.invoice))) {
          return prev;
        }
        return [{
          id: String(newTrx.id),
          invoice: String(newTrx.invoice),
          id_produk: String(newTrx.id_produk || ""),
          id_game: String(newTrx.id_game || ""),
          price: Number(newTrx.price || 0),
          status_pembayaran: String(newTrx.status_pembayaran || "Pending"),
          bukti_status_pembayaran_url: newTrx.bukti_status_pembayaran_url || null,
          username_roblox: newTrx.username_roblox || null,
          status_transaksi: String(newTrx.status_transaksi || "Pending"),
          kode_server_join: newTrx.kode_server_join || null,
          bukti_transaksi_url: newTrx.bukti_transaksi_url || null,
          create_at: newTrx.create_at ? new Date(newTrx.create_at).toISOString() : new Date().toISOString(),
          nama_produk: newTrx.nama_produk || null,
          game_name: newTrx.game_name || null,
        }, ...prev];
      });
      router.refresh();
    };

    const handleUpdated = (updatedTrx: any) => {
      if (!updatedTrx) return;
      setTrxList((prev) =>
        prev.map((t) => {
          if (t.id === String(updatedTrx.id) || t.invoice === String(updatedTrx.invoice)) {
            if (updatedTrx.kode_server_join && updatedTrx.kode_server_join !== t.kode_server_join) {
              toast.success(`Kode server diterima untuk invoice #${t.invoice}!`, { icon: "🎮" });
            }
            if (updatedTrx.status_transaksi && updatedTrx.status_transaksi !== t.status_transaksi) {
              toast.success(`Status transaksi #${t.invoice} diperbarui: ${updatedTrx.status_transaksi}`);
            }
            return {
              ...t,
              ...updatedTrx,
              id: String(updatedTrx.id || t.id),
              price: Number(updatedTrx.price ?? t.price),
              kode_server_join: updatedTrx.kode_server_join ?? t.kode_server_join,
              bukti_transaksi_url: updatedTrx.bukti_transaksi_url ?? t.bukti_transaksi_url,
              bukti_status_pembayaran_url: updatedTrx.bukti_status_pembayaran_url ?? t.bukti_status_pembayaran_url,
            };
          }
          return t;
        })
      );
      router.refresh();
    };

    const handleDeleted = (data: { id: string }) => {
      if (!data?.id) return;
      setTrxList((prev) => prev.filter((t) => t.id !== String(data.id)));
      router.refresh();
    };

    channel.bind("reseller-trx-created", handleCreated);
    channel.bind("reseller-trx-updated", handleUpdated);
    channel.bind("reseller-trx-deleted", handleDeleted);

    return () => {
      channel.unbind("reseller-trx-created", handleCreated);
      channel.unbind("reseller-trx-updated", handleUpdated);
      channel.unbind("reseller-trx-deleted", handleDeleted);
      pusher.unsubscribe("reseller-transactions");
    };
  }, [router]);

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Kode server berhasil disalin!");
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    }
  };

  const filteredList = trxList.filter((trx) => {
    const stTrx = (trx.status_transaksi || "").toLowerCase();
    const stPay = (trx.status_pembayaran || "").toLowerCase();

    if (filter === "selesai") {
      return stTrx === "selesai" || stTrx === "success" || stTrx === "sukses";
    }
    if (filter === "proses") {
      return (
        stTrx === "pending" ||
        stTrx === "proses" ||
        stPay === "pending" ||
        stPay === "cek pembayaran"
      );
    }
    if (filter === "gagal") {
      return stTrx === "gagal" || stTrx === "batal" || stPay === "batal" || stPay === "ditolak";
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#121212] animate-fade-in pb-16">
      <Toaster position="top-center" />
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md z-10 px-4 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Riwayat Transaksi</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-[#1a1a1a] shadow-sm mb-3 px-2 border-b border-gray-100 dark:border-white/5">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors border-b-2 ${
            filter === "all"
              ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700"
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter("proses")}
          className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors border-b-2 ${
            filter === "proses"
              ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700"
          }`}
        >
          Proses
        </button>
        <button
          onClick={() => setFilter("selesai")}
          className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors border-b-2 ${
            filter === "selesai"
              ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700"
          }`}
        >
          Selesai
        </button>
        <button
          onClick={() => setFilter("gagal")}
          className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors border-b-2 ${
            filter === "gagal"
              ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700"
          }`}
        >
          Gagal
        </button>
      </div>

      {/* Transaction List */}
      <div className="p-4 flex flex-col gap-3">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500">
            <i className="fa-solid fa-receipt text-4xl mb-3 opacity-40"></i>
            <p className="text-sm font-medium">Belum ada riwayat transaksi pada kategori ini.</p>
          </div>
        ) : (
          filteredList.map((trx) => {
            const dateStr = new Date(trx.create_at).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const isPending =
              trx.status_transaksi?.toLowerCase() === "pending" ||
              trx.status_pembayaran?.toLowerCase() === "pending" ||
              trx.status_pembayaran?.toLowerCase() === "cek pembayaran";

            const isSuccess =
              trx.status_transaksi?.toLowerCase() === "selesai" ||
              trx.status_transaksi?.toLowerCase() === "success" ||
              trx.status_transaksi?.toLowerCase() === "sukses";

            return (
              <div
                key={trx.id}
                className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col gap-3 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isSuccess
                          ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                          : isPending
                          ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                          : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                      }`}
                    >
                      <i
                        className={`fa-solid ${
                          isSuccess
                            ? "fa-check"
                            : isPending
                            ? "fa-hourglass-half"
                            : "fa-xmark"
                        }`}
                      ></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {trx.nama_produk || "Produk Game"}
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {trx.game_name || "Roblox"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                      Rp {Number(trx.price || 0).toLocaleString("id-ID")}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                        isSuccess
                          ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-800"
                          : isPending
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                          : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-800"
                      }`}
                    >
                      {trx.status_transaksi || "Pending"}
                    </span>
                  </div>
                </div>

                {/* Kode Server Section */}
                {trx.kode_server_join && (
                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <i className="fa-solid fa-server text-xs"></i>
                        <span className="text-[11px] font-bold uppercase tracking-wider">Kode Server</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {trx.kode_server_join.startsWith("http") && (
                          <a
                            href={trx.kode_server_join}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1 transition shadow-xs"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Join
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopy(trx.kode_server_join!, trx.id)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 text-[11px] font-semibold text-gray-700 dark:text-zinc-200 flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                          title="Salin Kode Server"
                        >
                          {copiedId === trx.id ? (
                            <>
                              <i className="fa-solid fa-check text-green-500 text-xs"></i>
                              <span className="text-green-600 dark:text-green-400 font-bold">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <i className="fa-regular fa-copy text-xs text-gray-500 dark:text-zinc-400"></i>
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="bg-white/80 dark:bg-black/30 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-950/50">
                      <p className="font-mono text-xs text-gray-800 dark:text-zinc-200 select-all break-all">
                        {trx.kode_server_join}
                      </p>
                    </div>
                  </div>
                )}

                {/* Details Footer */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                      {trx.invoice}
                    </span>
                    <span>•</span>
                    <span>{dateStr}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {trx.username_roblox && (
                      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <i className="fa-solid fa-user text-gray-400 text-[10px]"></i>
                        {trx.username_roblox}
                      </span>
                    )}

                    {trx.bukti_status_pembayaran_url ? (
                      <button
                        onClick={() => setPreviewImage(trx.bukti_status_pembayaran_url || null)}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <i className="fa-solid fa-image text-[10px]"></i> Bukti Bayar
                      </button>
                    ) : trx.status_pembayaran?.toLowerCase() === "pending" ? (
                      <Link
                        href={`/reseller/order/payment/${trx.invoice}`}
                        className="bg-[#FECB2F] hover:bg-[#e5b62a] text-[#222] font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-sm transition"
                      >
                        <i className="fa-solid fa-qrcode text-[9px]"></i> Bayar / Upload Bukti
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-[#1e1e1e] rounded-2xl p-4 max-w-lg w-full border border-white/10 shadow-2xl relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-receipt text-blue-400"></i> Bukti Pembayaran (ImageKit)
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full max-h-[70vh] flex items-center justify-center bg-black/40 rounded-xl overflow-hidden p-2">
              <img
                src={previewImage}
                alt="Bukti Transfer ImageKit"
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="w-full mt-3 flex justify-between items-center">
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Buka di tab baru
              </a>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
