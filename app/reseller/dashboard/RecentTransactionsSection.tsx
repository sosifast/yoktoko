"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { getPusherClient } from "@/lib/pusher-client";

interface RecentTransactionsSectionProps {
  initialTransactions: any[];
  userId: string;
}

export default function RecentTransactionsSection({
  initialTransactions,
  userId,
}: RecentTransactionsSectionProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>(initialTransactions);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("reseller-transactions");

    const handleCreated = (newTrx: any) => {
      if (!newTrx) return;
      if (String(newTrx.id_user) === String(userId)) {
        setTransactions((prev) => [newTrx, ...prev].slice(0, 5));
        toast.success(`Pesanan baru dibuat #${newTrx.invoice}!`);
        router.refresh();
      }
    };

    const handleUpdated = (updatedTrx: any) => {
      if (!updatedTrx) return;
      if (String(updatedTrx.id_user) === String(userId)) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === updatedTrx.id || t.invoice === updatedTrx.invoice
              ? { ...t, ...updatedTrx }
              : t
          )
        );
        if (updatedTrx.kode_server_join) {
          toast.success(`Kode server diterima untuk #${updatedTrx.invoice}!`, { icon: "🎮" });
        }
        if (updatedTrx.status_transaksi) {
          toast.success(`Status pesanan #${updatedTrx.invoice}: ${updatedTrx.status_transaksi}`);
        }
        router.refresh();
      }
    };

    const handleDeleted = (data: { id: string }) => {
      if (!data?.id) return;
      setTransactions((prev) => prev.filter((t) => t.id !== data.id));
      router.refresh();
    };

    const handleVipUpdated = (data: any) => {
      if (data && String(data.id_user) === String(userId)) {
        toast.success("Status membership VIP Anda telah diperbarui!", { icon: "👑" });
        router.refresh();
      }
    };

    channel.bind("reseller-trx-created", handleCreated);
    channel.bind("reseller-trx-updated", handleUpdated);
    channel.bind("reseller-trx-deleted", handleDeleted);
    channel.bind("vip-plan-updated", handleVipUpdated);

    return () => {
      channel.unbind("reseller-trx-created", handleCreated);
      channel.unbind("reseller-trx-updated", handleUpdated);
      channel.unbind("reseller-trx-deleted", handleDeleted);
      channel.unbind("vip-plan-updated", handleVipUpdated);
      pusher.unsubscribe("reseller-transactions");
    };
  }, [userId, router]);

  return (
    <div>
      <Toaster position="top-center" />
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-gray-900 dark:text-gray-100 font-bold text-sm sm:text-base">
          Transaksi Terbaru
        </h3>
        <Link
          href="/reseller/transaksi"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Lihat Semua <i className="fa-solid fa-chevron-right text-[10px]"></i>
        </Link>
      </div>

      {transactions.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {transactions.map((trx: any) => {
            const isSuccess =
              trx.status_transaksi?.toLowerCase() === "selesai" ||
              trx.status_transaksi?.toLowerCase() === "success" ||
              trx.status_transaksi?.toLowerCase() === "sukses";

            const isPending =
              trx.status_transaksi?.toLowerCase() === "pending" ||
              trx.status_pembayaran?.toLowerCase() === "pending" ||
              trx.status_pembayaran?.toLowerCase() === "cek pembayaran";

            const dateFormatted = new Date(trx.create_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

            const isPendingPayment = trx.status_pembayaran?.toLowerCase() === "pending";

            return (
              <Link
                key={trx.id}
                href={
                  isPendingPayment
                    ? `/reseller/order/payment/${trx.invoice}`
                    : "/reseller/transaksi"
                }
                className="bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#222] border border-gray-100 dark:border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs transition group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
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
                      } text-xs`}
                    ></i>
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                      {trx.nama_produk || "Produk Game"}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                      <span className="font-mono text-[10px] bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                        {trx.invoice}
                      </span>
                      <span>•</span>
                      <span>{dateFormatted}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                    Rp {Number(trx.price || 0).toLocaleString("id-ID")}
                  </p>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
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
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 text-center border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 mb-2">
            <i className="fa-solid fa-receipt text-lg"></i>
          </div>
          <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
            Belum ada riwayat transaksi
          </p>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
            Pesanan reseller Anda akan otomatis tercatat di sini secara realtime.
          </p>
        </div>
      )}
    </div>
  );
}
