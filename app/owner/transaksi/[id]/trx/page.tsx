"use client";

import Sidebar from "@/app/components/Sidebar";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getTransaksiById, updateStatusTransaksi, checkRobloxAccount, updateUsernameRoblox } from "../../actions";
import { getPusherClient } from "@/lib/pusher-client";

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending", icon: "⏳", color: "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30" },
  { value: "Pay", label: "Pay", icon: "💳", color: "bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30" },
  { value: "Kirim", label: "Kirim", icon: "📦", color: "bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30" },
  { value: "Selesai", label: "Selesai", icon: "✅", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30" },
  { value: "Cancel", label: "Cancel", icon: "❌", color: "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30" },
];

export default function DetailTransaksiPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [trx, setTrx] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);

  // Roblox state & check
  const [inputRoblox, setInputRoblox] = useState("");
  const [isEditingRoblox, setIsEditingRoblox] = useState(false);
  const [checkingRoblox, setCheckingRoblox] = useState(false);
  const [savingRoblox, setSavingRoblox] = useState(false);
  const [verifiedRoblox, setVerifiedRoblox] = useState<{
    id: number;
    name: string;
    displayName: string;
    avatarUrl: string;
  } | null>(null);

  // Fetch transaction detail
  const fetchTrxDetail = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      const data = await getTransaksiById(id);
      setTrx(data);
      if (data) {
        setInputRoblox(data.username_roblox || "");
        if (!data.username_roblox) {
          setIsEditingRoblox(true);
        }
      }
    } catch (err: any) {
      console.error("Gagal memuat detail transaksi:", err);
      if (!silent) toast.error("Transaksi tidak ditemukan atau terjadi kesalahan.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrxDetail();
  }, [fetchTrxDetail]);

  // Real-time updates with Pusher
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher || !id) return;

    const channel = pusher.subscribe("transactions-queue");

    const handleUpdate = (updatedData: any) => {
      if (updatedData && updatedData.id === id) {
        setTrx((prev: any) => ({ ...prev, ...updatedData }));
      }
    };

    channel.bind("transaction-updated", handleUpdate);

    return () => {
      channel.unbind("transaction-updated", handleUpdate);
      pusher.unsubscribe("transactions-queue");
    };
  }, [id]);

  // Update Status handler
  const handleUpdateStatus = async (newStatus: string) => {
    if (!trx || updatingStatus || trx.status === newStatus) return;

    const curStatus = (trx.status || "").toLowerCase();
    if (["selesai", "cancel", "batal"].includes(curStatus)) {
      toast.error(`Transaksi sudah berstatus "${trx.status}" dan tidak dapat diubah lagi.`);
      return;
    }

    setUpdatingStatus(true);
    try {
      await updateStatusTransaksi(trx.id, newStatus);
      setTrx((prev: any) => ({ ...prev, status: newStatus }));
      toast.success(`Status berhasil diperbarui ke: ${newStatus}`, {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal memperbarui status transaksi.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Check Roblox Account via API
  const handleCheckRoblox = async (targetUsername?: string) => {
    if (checkingRoblox) return;
    const q = (targetUsername !== undefined ? targetUsername : inputRoblox).trim();
    if (!q) {
      toast.error("Masukkan username Roblox terlebih dahulu.", {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
      return;
    }

    setCheckingRoblox(true);
    setVerifiedRoblox(null);

    try {
      const res = await checkRobloxAccount(q);
      if (!res.success || !res.user) {
        toast.error(res.error || "Akun Roblox tidak ditemukan. Periksa kembali username Anda.", {
          style: {
            borderRadius: "10px",
            background: "#222",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        });
        return;
      }

      setVerifiedRoblox(res.user);
      setInputRoblox(res.user.name);
      toast.success(`Akun Roblox terverifikasi: ${res.user.displayName} (@${res.user.name})`, {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal menghubungi server Roblox API.", {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
    } finally {
      setCheckingRoblox(false);
    }
  };

  // Save Roblox Account
  const handleSaveRoblox = async () => {
    if (!trx || savingRoblox) return;
    const curStatus = (trx.status || "").toLowerCase();
    if (["selesai", "cancel", "batal"].includes(curStatus)) {
      toast.error(`Transaksi sudah berstatus "${trx.status}" dan tidak dapat diubah lagi.`);
      return;
    }

    setSavingRoblox(true);
    try {
      await updateUsernameRoblox(trx.id, inputRoblox.trim());
      setTrx((prev: any) => ({ ...prev, username_roblox: inputRoblox.trim() }));
      setIsEditingRoblox(false);
      toast.success(inputRoblox.trim() ? "Akun Roblox berhasil disimpan!" : "Username Roblox dikosongkan.", {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menyimpan akun Roblox.");
    } finally {
      setSavingRoblox(false);
    }
  };

  const parseDataOrder = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }
    return [];
  };

  const orderItems = parseDataOrder(trx?.data_order);
  const isLocked = ["selesai", "cancel", "batal"].includes((trx?.status || "").toLowerCase());

  // Generate formatted receipt for customer (Roblox username & item produk only)
  const generateResiText = () => {
    if (!trx) return "";
    const productItems = orderItems.filter(
      (item) => !item.nama?.toLowerCase().startsWith("discount")
    );

    const itemsText = productItems.length > 0
      ? productItems.map((item, idx) => `${idx + 1}. ${item.nama} (${item.kuantitas}x)`).join("\n")
      : "-";

    return `Username Roblox: ${trx.username_roblox ? `@${trx.username_roblox}` : "-"}
Item Produk:
${itemsText}`;
  };

  const handleCopyResi = () => {
    const text = generateResiText();
    navigator.clipboard.writeText(text);
    setCopiedResi(true);
    toast.success("Format pesan struk berhasil disalin!");
    setTimeout(() => setCopiedResi(false), 2000);
  };

  const getStatusBadge = (statusName: string) => {
    const found = STATUS_OPTIONS.find((s) => s.value.toLowerCase() === (statusName || "").toLowerCase());
    if (found) {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${found.color}`}>
          <span>{found.icon}</span>
          <span>{found.label}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-700/40 px-3 py-1 text-xs font-bold text-zinc-300">
        {statusName || "Pending"}
      </span>
    );
  };

  return (
    <Sidebar>
      <div className="p-8">
        {/* Navigation & Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Link href="/owner/transaksi" className="hover:text-white transition">
                POS Kasir
              </Link>
              <span>/</span>
              <Link href="/owner/transaksi/history" className="hover:text-white transition">
                Riwayat
              </Link>
              <span>/</span>
              <span className="text-[#FECB2F] font-semibold">Detail Transaksi</span>
            </div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <span>🧾 Detail Transaksi</span>
              {trx && getStatusBadge(trx.status)}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleCopyResi}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#222222] px-4 py-2.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-[#333] transition"
              title="Salin teks struk untuk dikirim ke pembeli"
            >
              <span>{copiedResi ? "✓ Resi Tersalin" : "📋 Salin Resi"}</span>
            </button>

            <Link
              href="/owner/transaksi/history"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#222222] px-4 py-2.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-[#333] transition"
            >
              <span>📋 Semua Riwayat</span>
            </Link>

            <Link
              href="/owner/transaksi"
              className="flex items-center gap-2 rounded-xl bg-[#FECB2F] px-4 py-2.5 text-xs font-bold text-[#222222] hover:bg-[#e5b62a] shadow-[0_0_15px_-3px_#FECB2F]/40 transition"
            >
              <span>⚡ + Transaksi Baru</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
            <span className="text-3xl animate-spin mb-3">⏳</span>
            <p className="text-sm font-medium">Memuat detail transaksi...</p>
          </div>
        ) : !trx ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-12 text-center text-red-400">
            <p className="font-bold text-lg mb-2">Transaksi Tidak Ditemukan</p>
            <p className="text-xs text-zinc-400 mb-6">ID transaksi yang Anda cari tidak tersedia di database.</p>
            <Link
              href="/owner/transaksi"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FECB2F] px-5 py-2.5 text-xs font-bold text-[#222222]"
            >
              &larr; Kembali ke Kasir POS
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Status & Update Action Banner */}
            <div className="rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Status Pesanan Saat Ini</span>
                  <div className="mt-1.5 flex items-center gap-3">
                    {getStatusBadge(trx.status)}
                    <span className="font-mono text-xs text-zinc-500">
                      ID: <span className="text-zinc-300">{trx.id}</span>
                    </span>
                  </div>
                </div>

                {/* Status Update Button Group */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-xs font-bold text-zinc-400">Ubah Status Langsung:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {STATUS_OPTIONS.map((st) => {
                      const isActive = (trx.status || "").toLowerCase() === st.value.toLowerCase();
                      const isLocked = ["selesai", "cancel", "batal"].includes((trx.status || "").toLowerCase());

                      return (
                        <button
                          key={st.value}
                          type="button"
                          disabled={updatingStatus || isActive || (isLocked && !isActive)}
                          onClick={() => handleUpdateStatus(st.value)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                            isActive
                              ? `${st.color} ring-2 ring-[#FECB2F] shadow-lg scale-105`
                              : isLocked
                              ? "opacity-30 border-white/5 bg-[#1a1a1a] text-zinc-600 cursor-not-allowed"
                              : "border-white/10 bg-[#1a1a1a] text-zinc-300 hover:text-white hover:border-white/20 active:scale-95"
                          }`}
                        >
                          <span>{st.icon}</span>
                          <span>{st.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {["selesai", "cancel", "batal"].includes((trx.status || "").toLowerCase()) && (
                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-zinc-500 flex items-center gap-2">
                  <span>🔒</span>
                  <span>Transaksi telah mencapai status akhir ({trx.status}) dan terkunci dari perubahan lebih lanjut.</span>
                </div>
              )}
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Customer & Items */}
              <div className="lg:col-span-7 space-y-6">
                {/* Customer Card */}
                <div className="rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <span>👤</span> Informasi Pembeli
                    </h3>
                    {!isLocked && trx.username_roblox && !isEditingRoblox && (
                      <button
                        type="button"
                        onClick={() => {
                          setInputRoblox(trx.username_roblox);
                          setIsEditingRoblox(true);
                        }}
                        className="text-xs font-bold text-[#FECB2F] hover:underline flex items-center gap-1.5 transition"
                      >
                        <span>✏️ Ubah Akun</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Roblox Account Section */}
                    <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Akun Roblox Pembeli
                        </span>
                        {verifiedRoblox && (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Terverifikasi
                          </span>
                        )}
                      </div>

                      {/* Display Mode (when not editing and has username) */}
                      {!isEditingRoblox && trx.username_roblox ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg font-black text-[#FECB2F]">
                                @{trx.username_roblox}
                              </span>
                              <a
                                href={`https://www.roblox.com/users/profile?username=${encodeURIComponent(trx.username_roblox)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-zinc-400 hover:text-[#FECB2F] underline transition"
                                title="Buka profil Roblox"
                              >
                                ↗ Buka Profil
                              </a>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCheckRoblox(trx.username_roblox)}
                                disabled={checkingRoblox}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition disabled:opacity-50"
                              >
                                {checkingRoblox ? (
                                  <>
                                    <span className="animate-spin">⏳</span>
                                    <span>Memeriksa...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>🔍</span>
                                    <span>Cek Akun</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Edit / Input Mode */
                        <div className="space-y-3">
                          {!trx.username_roblox && (
                            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-xs text-amber-300 flex items-center gap-2">
                              <span>⚠️</span>
                              <span>Akun Roblox belum dimasukkan. Silakan masukkan username di bawah:</span>
                            </div>
                          )}

                          {isLocked ? (
                            <div className="text-sm text-zinc-400 italic">
                              {trx.username_roblox ? `@${trx.username_roblox}` : "Tidak ada akun Roblox (transaksi telah dikunci)."}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={inputRoblox}
                                  onChange={(e) => {
                                    setInputRoblox(e.target.value);
                                    if (verifiedRoblox && e.target.value.toLowerCase() !== verifiedRoblox.name.toLowerCase()) {
                                      setVerifiedRoblox(null);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleCheckRoblox();
                                    }
                                  }}
                                  placeholder="Masukkan username Roblox..."
                                  className="flex-1 rounded-xl border border-white/10 bg-[#222] px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleCheckRoblox()}
                                  disabled={checkingRoblox || !inputRoblox.trim()}
                                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 border border-white/5"
                                >
                                  {checkingRoblox ? (
                                    <>
                                      <span className="animate-spin">⏳</span>
                                      <span>Cek...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>🔍</span>
                                      <span>Cek Akun</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={handleSaveRoblox}
                                  disabled={savingRoblox}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FECB2F] to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                                >
                                  {savingRoblox ? "Menyimpan..." : "💾 Simpan Akun"}
                                </button>

                                {trx.username_roblox && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInputRoblox(trx.username_roblox);
                                      setIsEditingRoblox(false);
                                    }}
                                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-semibold text-xs transition"
                                  >
                                    Batal
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Verified Preview Card */}
                      {verifiedRoblox && (
                        <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                              {verifiedRoblox.avatarUrl ? (
                                <img
                                  src={verifiedRoblox.avatarUrl}
                                  alt={verifiedRoblox.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xl">👤</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">
                                  {verifiedRoblox.displayName}
                                </span>
                                <span className="text-xs text-zinc-400 font-medium">
                                  (@{verifiedRoblox.name})
                                </span>
                              </div>
                              <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-2 mt-0.5">
                                <span>ID: {verifiedRoblox.id}</span>
                                <span>•</span>
                                <a
                                  href={`https://www.roblox.com/users/${verifiedRoblox.id}/profile`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-emerald-300 transition font-sans"
                                >
                                  Buka Profil ↗
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TikTok Account Section */}
                    <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        Username TikTok
                      </span>
                      <p className="mt-1.5 text-base font-bold text-white">
                        {trx.username_tiktok || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Purchased Card */}
                <div className="rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <span>📦</span> Rincian Item Pesanan
                    </h3>
                    <span className="text-xs text-zinc-400">
                      {orderItems.length} item
                    </span>
                  </div>

                  <div className="divide-y divide-[#333] rounded-xl border border-white/5 bg-[#1a1a1a] overflow-hidden">
                    {orderItems.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-500">Tidak ada rincian item.</div>
                    ) : (
                      orderItems.map((item, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between text-sm">
                          <div>
                            <p className="font-bold text-white">{item.nama}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {item.kuantitas} x Rp {Number(item.harga || 0).toLocaleString("id-ID")}
                            </p>
                          </div>
                          <span className="font-black text-white">
                            Rp {Number(item.subtotal || item.harga * item.kuantitas || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Bill Breakdown */}
                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Subtotal Item:</span>
                      <span className="font-semibold text-white">Rp {Number(trx.subtotal || 0).toLocaleString("id-ID")}</span>
                    </div>

                    {Number(trx.diskon || 0) > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Potongan Diskon:</span>
                        <span className="font-semibold">- Rp {Number(trx.diskon).toLocaleString("id-ID")}</span>
                      </div>
                    )}

                    {Number(trx.kode_unik || 0) > 0 && (
                      <div className="flex justify-between text-zinc-300 items-center">
                        <span>Kode Unik Konfirmasi Transfer:</span>
                        <span className="font-bold text-[#FECB2F] bg-[#FECB2F]/15 px-2 py-0.5 rounded border border-[#FECB2F]/30">
                          + Rp {trx.kode_unik}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-[#333] pt-3 flex justify-between items-center text-white">
                      <span className="font-extrabold text-sm">Total Pembayaran:</span>
                      <span className="text-2xl font-black text-[#FECB2F]">
                        Rp {Number(trx.harga || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Game, Suplier & Meta */}
              <div className="lg:col-span-5 space-y-6">
                {/* Meta & Suplier Card */}
                <div className="rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-xl space-y-4">
                  <h3 className="font-bold text-white text-base border-b border-[#333] pb-3 flex items-center gap-2">
                    <span>⚙️</span> Detail Game & Suplier
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500">Game:</span>
                      <span className="font-bold text-white">{trx.game_name || "-"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500">Kategori:</span>
                      <span className="font-bold text-white">{trx.kategori_name || "-"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500">Suplier:</span>
                      <span className="font-bold text-[#FECB2F]">{trx.suplier_name || "-"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500">Rate Suplier:</span>
                      <span className="font-bold text-white">{Number(trx.rate_robux_suplier || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500">Rate Dijual:</span>
                      <span className="font-bold text-white">{Number(trx.rate_robux_dijual || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500">Waktu Dibuat:</span>
                      <span className="text-zinc-300">
                        {new Date(trx.create_at).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-500">Terakhir Update:</span>
                      <span className="text-zinc-300">
                        {new Date(trx.update_at).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Struk Text Preview Card */}
                <div className="rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>📱</span> Format Pesan Struk
                    </h3>
                    <button
                      type="button"
                      onClick={handleCopyResi}
                      className="text-xs text-[#FECB2F] hover:underline font-bold"
                    >
                      {copiedResi ? "✓ Tersalin" : "Salin"}
                    </button>
                  </div>

                  <pre className="rounded-xl border border-white/5 bg-[#1a1a1a] p-3 text-[11px] text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-56 leading-relaxed">
                    {generateResiText()}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        <Toaster position="bottom-right" reverseOrder={false} />
      </div>
    </Sidebar>
  );
}
