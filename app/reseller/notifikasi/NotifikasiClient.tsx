"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { getPusherClient } from "@/lib/pusher-client";

export interface NotifikasiItem {
  id: string;
  judul: string;
  konten: string;
  create_at: string;
  update_at: string;
}

export default function NotifikasiClient({
  initialNotifications,
}: {
  initialNotifications: NotifikasiItem[];
}) {
  const [notifications, setNotifications] = useState<NotifikasiItem[]>(initialNotifications);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Realtime Pusher Listener
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("reseller-notifications");

    const handleCreated = (newNotif: any) => {
      if (!newNotif) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === String(newNotif.id))) return prev;
        return [
          {
            id: String(newNotif.id),
            judul: String(newNotif.judul),
            konten: String(newNotif.konten),
            create_at: newNotif.create_at ? new Date(newNotif.create_at).toISOString() : new Date().toISOString(),
            update_at: newNotif.update_at ? new Date(newNotif.update_at).toISOString() : new Date().toISOString(),
          },
          ...prev,
        ];
      });

      toast(
        (t) => (
          <div className="flex items-start gap-2.5">
            <i className="fa-solid fa-bullhorn text-[#FECB2F] text-base mt-0.5"></i>
            <div>
              <p className="font-bold text-xs text-white">{newNotif.judul}</p>
              <p className="text-[11px] text-zinc-300 line-clamp-2 mt-0.5">{newNotif.konten}</p>
            </div>
          </div>
        ),
        {
          duration: 4000,
          style: {
            background: "#222",
            border: "1px solid #444",
            color: "#fff",
          },
        }
      );
    };

    const handleUpdated = (updatedNotif: any) => {
      if (!updatedNotif) return;
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === String(updatedNotif.id)
            ? {
                ...n,
                judul: updatedNotif.judul || n.judul,
                konten: updatedNotif.konten || n.konten,
                update_at: updatedNotif.update_at || n.update_at,
              }
            : n
        )
      );
    };

    const handleDeleted = (data: { id: string }) => {
      if (!data?.id) return;
      setNotifications((prev) => prev.filter((n) => n.id !== String(data.id)));
    };

    channel.bind("notification-created", handleCreated);
    channel.bind("notification-updated", handleUpdated);
    channel.bind("notification-deleted", handleDeleted);

    return () => {
      channel.unbind("notification-created", handleCreated);
      channel.unbind("notification-updated", handleUpdated);
      channel.unbind("notification-deleted", handleDeleted);
      pusher.unsubscribe("reseller-notifications");
    };
  }, []);

  return (
    <div className="p-4 flex flex-col gap-5 animate-fade-in pb-10">
      <Toaster position="top-center" />

      {/* Top Navbar */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link
            href="/reseller/dashboard"
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#222222] shadow-sm flex items-center justify-center text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-[#333] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition active:scale-95"
            title="Kembali ke Dashboard"
          >
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Notifikasi
            </h1>
          </div>
        </div>
      </div>

      {/* Notification Cards List */}
      <div className="flex flex-col gap-3.5">
        {notifications.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 mb-3 shadow-inner">
              <i className="fa-regular fa-bell-slash text-2xl"></i>
            </div>
            <h3 className="font-bold text-sm text-gray-800 dark:text-zinc-200 mb-1">
              Belum Ada Notifikasi
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-xs">
              Informasi promo, update game, atau maintenance server akan muncul di sini secara realtime.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const createDate = new Date(item.create_at);
            const isRecent = Date.now() - createDate.getTime() < 24 * 60 * 60 * 1000;

            const dateStr = createDate.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col gap-3 transition-all hover:border-[#FECB2F]/40"
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FECB2F]/15 text-[#FECB2F] flex items-center justify-center shrink-0 shadow-xs">
                      <i className="fa-solid fa-bullhorn text-xs"></i>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                        {item.judul}
                      </h2>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                        <i className="fa-regular fa-clock text-[9px] mr-1"></i>
                        {dateStr}
                      </p>
                    </div>
                  </div>

                  {isRecent && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FECB2F]/20 text-[#FECB2F] border border-[#FECB2F]/40 shrink-0 uppercase tracking-wider">
                      Baru
                    </span>
                  )}
                </div>

                {/* Body Content */}
                <div className="pt-2 border-t border-gray-50 dark:border-white/5">
                  <p className="text-xs text-gray-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                    {item.konten}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
