"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { getQueueData, QueueTransaction } from "./actions";

interface ModalPopupData {
  id: string;
  type: "sukses" | "batal";
  username: string;
}

export default function MonitorPage() {
  const [activeQueue, setActiveQueue] = useState<QueueTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPusherConnected, setIsPusherConnected] = useState(false);
  const [soundEnabled] = useState(true);

  // Active popup modal for cancel or success
  const [activeModal, setActiveModal] = useState<ModalPopupData | null>(null);

  // Web Audio API Synthesizer for alerts
  const playSoundAlert = useCallback((type: "sukses" | "batal") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === "sukses") {
        // Celebratory melodic triad: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.12);
        osc.frequency.setValueAtTime(783.99, now + 0.24);
        osc.frequency.setValueAtTime(1046.5, now + 0.36);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.75);
      } else {
        // Cancel Alert: 2-tone descending buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(200, now + 0.18);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.55);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // Active queue reference for stable callbacks
  const activeQueueRef = useRef(activeQueue);
  activeQueueRef.current = activeQueue;

  // Track items currently undergoing exit animation to avoid duplicate triggers
  const exitingIdsRef = useRef<Set<string>>(new Set());

  // Trigger Exit Modal Pop-up when Sukses or Cancel
  const triggerExitModal = useCallback((id: string, newStatus: string, fallbackUsername?: string) => {
    // If this item is already exiting, prevent duplicate alerts
    if (exitingIdsRef.current.has(id)) return;
    exitingIdsRef.current.add(id);

    const isSuccess = newStatus.toLowerCase() === "selesai";
    const type: "sukses" | "batal" = isSuccess ? "sukses" : "batal";

    // Play sound alert
    playSoundAlert(type);

    // Find username from current queue ref or fallback
    let user = fallbackUsername || "";
    if (!user) {
      const match = activeQueueRef.current.find((t) => t.id === id);
      if (match) {
        user = match.username_tiktok || match.username_roblox || "User";
      } else {
        user = "User";
      }
    }

    const formattedUser = user.startsWith("@") ? user : `@${user}`;

    // Show animated modal popup
    setActiveModal({
      id,
      type,
      username: formattedUser,
    });

    // Hold modal popup for 3.2 seconds, then close modal and remove from queue
    setTimeout(() => {
      setActiveModal((cur) => (cur?.id === id ? null : cur));
      setActiveQueue((prev) => prev.filter((t) => t.id !== id));
      exitingIdsRef.current.delete(id);
    }, 3200);
  }, [playSoundAlert]);

  // Initial Data Fetch
  const fetchQueue = useCallback(async () => {
    try {
      const data = await getQueueData();
      setActiveQueue(data.activeQueue);
    } catch (err) {
      console.error("Failed mengambil antrean stream:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Pusher Realtime Subscription with Polling Fallback
  useEffect(() => {
    const pusher = getPusherClient();
    let channel: any = null;

    if (pusher) {
      pusher.connection.bind("connected", () => setIsPusherConnected(true));
      pusher.connection.bind("disconnected", () => setIsPusherConnected(false));

      channel = pusher.subscribe("transactions-queue");

      channel.bind("transaction-created", (data: any) => {
        const status = (data.status || "Pending").toLowerCase();
        if (["pending", "bayar", "kirim"].includes(status)) {
          setActiveQueue((prev) => {
            if (prev.some((t) => t.id === data.id)) return prev;
            let dataOrder = [];
            try {
              dataOrder = typeof data.data_order === "string" ? JSON.parse(data.data_order) : (data.data_order || []);
            } catch {
              dataOrder = [];
            }
            return [
              ...prev,
              {
                ...data,
                harga: Number(data.harga) || 0,
                subtotal: Number(data.subtotal) || 0,
                kode_unik: Number(data.kode_unik) || 0,
                data_order: dataOrder,
              },
            ];
          });
        }
      });

      channel.bind("transaction-updated", (data: any) => {
        const newStatus = data.status || "";
        const lower = newStatus.toLowerCase();

        if (lower === "selesai" || lower === "batal") {
          const user = data.username_tiktok || data.username_roblox || "";
          triggerExitModal(data.id, newStatus, user);
        } else {
          setActiveQueue((prev) =>
            prev.map((t) => (t.id === data.id ? { ...t, status: newStatus } : t))
          );
        }
      });

      channel.bind("transaction-deleted", (data: any) => {
        exitingIdsRef.current.delete(data.id);
        setActiveQueue((prev) => prev.filter((t) => t.id !== data.id));
      });
    }

    // Polling fallback every 5 seconds (paused if tab is backgrounded)
    const interval = setInterval(async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      try {
        const fresh = await getQueueData();
        const currentActive = activeQueueRef.current;

        // 1. Check if any active item was completed/cancelled in DB
        currentActive.forEach((cur) => {
          if (exitingIdsRef.current.has(cur.id)) return;

          const finishedItem = fresh.finishedList.find((f: any) => f.id === cur.id);
          if (finishedItem) {
            const user =
              finishedItem.username_tiktok ||
              finishedItem.username_roblox ||
              cur.username_tiktok ||
              cur.username_roblox ||
              "";
            triggerExitModal(cur.id, finishedItem.status, user);
            return;
          }

          // If no longer in fresh activeQueue (e.g. deleted or marked non-active status)
          const stillActive = fresh.activeQueue.some((f: any) => f.id === cur.id);
          if (!stillActive) {
            setActiveQueue((prev) => prev.filter((t) => t.id !== cur.id));
          }
        });

        // 2. Add newly created pending transactions or update statuses
        fresh.activeQueue.forEach((item: any) => {
          const existing = currentActive.find((c) => c.id === item.id);
          if (!existing) {
            if (!exitingIdsRef.current.has(item.id)) {
              setActiveQueue((prev) => [...prev, item]);
            }
          } else if (existing.status !== item.status) {
            setActiveQueue((prev) =>
              prev.map((t) => (t.id === item.id ? { ...t, status: item.status } : t))
            );
          }
        });
      } catch {
        // Silent poll error
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (pusher && channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
    };
  }, [triggerExitModal]);

  const getStatusBadge = (statusName: string) => {
    const s = (statusName || "").toLowerCase();
    switch (s) {
      case "bayar":
        return (
          <span className="inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-black whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SUDAH BAYAR
          </span>
        );
      case "kirim":
        return (
          <span className="inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-black whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-bounce"></span>
            PROSES KIRIM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-black whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-[#FECB2F] animate-pulse"></span>
            BELUM BAYAR
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-transparent text-black font-sans select-none p-3 sm:p-5 md:p-6">
      <style>{`body { background: transparent !important; }`}</style>
      {/* Frameless Responsive Container */}
      <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px] mx-auto space-y-1 sm:space-y-1.5">
        {loading ? (
          <div className="py-12 text-center text-zinc-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#FECB2F] border-r-transparent"></div>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider">Loading...</p>
          </div>
        ) : activeQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <p className="text-xl sm:text-2xl font-black uppercase tracking-widest">Antrean Kosong</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {activeQueue.map((trx, index) => {
              const tiktokUser = trx.username_tiktok
                ? (trx.username_tiktok.startsWith("@") ? trx.username_tiktok : `@${trx.username_tiktok}`)
                : (trx.username_roblox ? `@${trx.username_roblox}` : "@user");

              return (
                <div
                  key={trx.id}
                  className="flex items-center justify-between gap-3 py-2.5 sm:py-3 transition-colors"
                >
                  {/* Left: Plain Number (Tanpa card/label) & TikTok User */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <span
                      className="text-lg sm:text-xl md:text-2xl font-black w-7 sm:w-8 shrink-0 text-left"
                    >
                      {index + 1}.
                    </span>

                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.78 1.25-.03 2.45-.73 3.05-1.81.33-.58.46-1.26.46-1.93.01-4.91.01-9.82 0-14.73z"/>
                      </svg>
                      <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wide truncate">
                        {tiktokUser}
                      </span>
                    </div>
                  </div>

                  {/* Right: Plain Status Pay */}
                  <div className="shrink-0">{getStatusBadge(trx.status)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ANIMATED MODAL POP-UP (Sukses & Cancel Alert for Streamers) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300">
          <div
            className={`relative w-full max-w-sm sm:max-w-md rounded-3xl p-6 sm:p-8 text-center shadow-2xl animate-modal-pop ${
              activeModal.type === "sukses"
                ? "border-4 border-emerald-400 bg-[#08170e] ring-4 ring-emerald-500/40 shadow-[0_0_80px_rgba(16,185,129,0.7)]"
                : "border-4 border-rose-500 bg-[#170808] ring-4 ring-rose-500/40 shadow-[0_0_80px_rgba(244,63,94,0.7)] animate-stream-shake"
            }`}
          >
            {/* Ambient Background Glow */}
            <div
              className={`absolute -top-10 -left-10 h-28 w-28 rounded-full blur-2xl opacity-40 pointer-events-none ${
                activeModal.type === "sukses" ? "bg-emerald-400" : "bg-rose-500"
              }`}
            />
            <div
              className={`absolute -bottom-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-40 pointer-events-none ${
                activeModal.type === "sukses" ? "bg-green-400" : "bg-red-500"
              }`}
            />

            {/* Big Modal Icon */}
            <div
              className={`mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl text-3xl sm:text-4xl shadow-xl mb-3 sm:mb-4 border ${
                activeModal.type === "sukses"
                  ? "bg-emerald-950/80 border-emerald-500/30"
                  : "bg-rose-950/80 border-rose-500/30"
              }`}
            >
              {activeModal.type === "sukses" ? "🎉" : "❌"}
            </div>

            {/* Modal Title */}
            <h2
              className={`text-lg sm:text-2xl font-black uppercase tracking-wider drop-shadow ${
                activeModal.type === "sukses" ? "text-emerald-400" : "text-rose-500"
              }`}
            >
              {activeModal.type === "sukses" ? "PESANAN BERHASIL SELESAI!" : "PESANAN DIBATALKAN!"}
            </h2>

            {/* TikTok User Badge */}
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-black/90 border border-white/20 px-4 py-2 text-sm sm:text-base font-black shadow-inner">
              <svg className="w-4 h-4 text-[#FECB2F] shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.78 1.25-.03 2.45-.73 3.05-1.81.33-.58.46-1.26.46-1.93.01-4.91.01-9.82 0-14.73z"/>
              </svg>
              <span className="text-[#FECB2F]">{activeModal.username}</span>
            </div>

            {/* Subtitle Message */}
            <p className="mt-3 text-xs sm:text-sm text-zinc-300 font-medium">
              {activeModal.type === "sukses"
                ? "Terima kasih! Pesanan telah selesai dan keluar dari antrean."
                : "Pesanan telah dibatalkan dan dikeluarkan dari antrean."}
            </p>

            {/* Countdown / Timeout Bar */}
            <div className="mt-5 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-3000 ${
                  activeModal.type === "sukses" ? "bg-emerald-400" : "bg-rose-500"
                }`}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
