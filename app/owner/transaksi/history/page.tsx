"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import toast, { Toaster } from "react-hot-toast";
import {
  getTransaksi,
  getDropdownDataForTransaksi,
  updateStatusTransaksi,
  deleteTransaksi,
  clearAllTransaksi,
  updateUsernameRoblox,
  addProductToTransaksi,
  applyDiscountToTransaksi,
} from "../actions";

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending", icon: "⏳", color: "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:border-amber-500/60" },
  { value: "Pay", label: "Pay", icon: "💳", color: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:border-blue-500/60" },
  { value: "Kirim", label: "Kirim", icon: "📦", color: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:border-purple-500/60" },
  { value: "Selesai", label: "Selesai", icon: "✅", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60" },
  { value: "Cancel", label: "Cancel", icon: "❌", color: "bg-red-500/20 text-red-300 border-red-500/30 hover:border-red-500/60" },
];

export default function RiwayatTransaksiPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);

  // Search & Filter & Pagination
  const [searchHistory, setSearchHistory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTrxDetail, setSelectedTrxDetail] = useState<any | null>(null);

  // Add Product Modal
  const [addProdukModalTrx, setAddProdukModalTrx] = useState<any | null>(null);
  const [selectedProdukToAdd, setSelectedProdukToAdd] = useState("");
  const [qtyToAdd, setQtyToAdd] = useState(1);
  const [searchProdukModal, setSearchProdukModal] = useState("");

  // Add Discount Modal
  const [addDiscountModalTrx, setAddDiscountModalTrx] = useState<any | null>(null);
  const [addDiscountType, setAddDiscountType] = useState<"nominal" | "percent">("nominal");
  const [addDiscountNominal, setAddDiscountNominal] = useState(0);

  // Delete Modal
  const [deleteModalTrx, setDeleteModalTrx] = useState<string | null>(null);

  const filteredProductsForModal = useMemo(() => {
    if (!searchProdukModal.trim()) return products;
    const q = searchProdukModal.toLowerCase().trim();
    return products.filter((p) => p.nama_produk?.toLowerCase().includes(q));
  }, [products, searchProdukModal]);

  const refreshTransactions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsLiveSyncing(true);

    try {
      const [trxList, dropdowns] = await Promise.all([
        getTransaksi(),
        getDropdownDataForTransaksi(),
      ]);
      setTransactions(trxList);
      setProducts(dropdowns.products || []);
    } catch (err) {
      console.error("Failed memperbarui riwayat transaksi:", err);
    } finally {
      if (!silent) setLoading(false);
      else setIsLiveSyncing(false);
    }
  }, []);

  const fetchData = refreshTransactions;

  useEffect(() => {
    fetchData();

    // Setup Pusher real-time listener
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("transactions-queue");

    channel.bind("transaction-created", (newTrx: any) => {
      setTransactions((prev) => {
        if (prev.some((t) => t.id === newTrx.id)) return prev;
        return [newTrx, ...prev];
      });
      toast.success("Transaksi baru masuk!", {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
    });

    channel.bind("transaction-updated", (updatedTrx: any) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTrx.id ? updatedTrx : t))
      );
      setSelectedTrxDetail((curr: any) => {
        if (curr && curr.id === updatedTrx.id) {
          return updatedTrx;
        }
        return curr;
      });
    });

    channel.bind("transaction-deleted", ({ id }: { id: string }) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setSelectedTrxDetail((curr: any) => (curr && curr.id === id ? null : curr));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("transactions-queue");
    };
  }, [fetchData]);

  // Live status update on transactions table
  const handleLiveStatusChange = async (id: string, newStatus: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    if (selectedTrxDetail && selectedTrxDetail.id === id) {
      setSelectedTrxDetail({ ...selectedTrxDetail, status: newStatus });
    }

    try {
      await updateStatusTransaksi(id, newStatus);
      toast.success(`Status transaksi berhasil diubah menjadi ${newStatus}`, {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
    } catch (err) {
      console.error("Failed update status:", err);
      toast.error("Gagal mengubah status transaksi", {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
      fetchData();
    }
  };

  const handleUpdateRobloxUsername = async (id: string, newUsername: string) => {
    try {
      await updateUsernameRoblox(id, newUsername);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, username_roblox: newUsername } : t))
      );
      toast.success("Username Roblox berhasil diupdate", {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
    } catch (err) {
      console.error("Failed update roblox:", err);
      toast.error("Gagal update username Roblox", {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
    }
  };

  const handleDeleteTrx = (id: string) => {
    setDeleteModalTrx(id);
  };

  const confirmDeleteTransaction = async () => {
    if (!deleteModalTrx) return;
    try {
      await deleteTransaksi(deleteModalTrx);
      setTransactions((prev) => prev.filter((t) => t.id !== deleteModalTrx));
      if (selectedTrxDetail && selectedTrxDetail.id === deleteModalTrx) {
        setSelectedTrxDetail(null);
      }
      toast.success("Transaksi berhasil dihapus");
    } catch (err: any) {
      alert(err.message || "Failed to delete transaction.");
    } finally {
      setDeleteModalTrx(null);
    }
  };

  const handleClearAll = async () => {
    if (confirm("Yakin ingin menghapus SELURUH transaksi? Tindakan ini tidak dapat dibatalkan!")) {
      try {
        await clearAllTransaksi();
        setTransactions([]);
        setSelectedTrxDetail(null);
        toast.success("Semua transaksi berhasil dibersihkan");
      } catch (err: any) {
        alert(err.message || "Failed to clear transactions.");
      }
    }
  };

  const openAddProdukModal = (trx: any) => {
    setAddProdukModalTrx(trx);
    setSelectedProdukToAdd("");
    setQtyToAdd(1);
    setSearchProdukModal("");
  };

  const handleAddProdukSubmit = async () => {
    if (!addProdukModalTrx || !selectedProdukToAdd || qtyToAdd < 1) return;
    const prod = products.find((p) => p.id === selectedProdukToAdd);
    if (!prod) return;

    try {
      await addProductToTransaksi(addProdukModalTrx.id, prod, qtyToAdd);
      setAddProdukModalTrx(null);
      toast.success("Produk berhasil ditambahkan!");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal menambahkan produk");
    }
  };

  const openAddDiscountModal = (trx: any) => {
    setAddDiscountModalTrx(trx);
    setAddDiscountType("nominal");
    setAddDiscountNominal(0);
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

  const getStatusBadge = (statusName: string) => {
    const found = STATUS_OPTIONS.find((s) => s.value.toLowerCase() === (statusName || "").toLowerCase());
    if (found) {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${found.color}`}>
          <span>{found.icon}</span>
          <span>{found.label}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-700/40 px-2.5 py-1 text-xs font-bold text-zinc-300">
        {statusName || "Pending"}
      </span>
    );
  };

  // Filter History Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter && t.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (searchHistory.trim()) {
        const q = searchHistory.toLowerCase().trim();
        const matchesId = t.id?.toLowerCase().includes(q);
        const matchesTiktok = t.username_tiktok?.toLowerCase().includes(q);
        const matchesRoblox = t.username_roblox?.toLowerCase().includes(q);
        const matchesGame = t.game_name?.toLowerCase().includes(q);
        const matchesSuplier = t.suplier_name?.toLowerCase().includes(q);
        return matchesId || matchesTiktok || matchesRoblox || matchesGame || matchesSuplier;
      }
      return true;
    });
  }, [transactions, searchHistory, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  return (
    <Sidebar>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Riwayat Transaksi POS</h1>
              {/* Live sync pill */}
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Sync {isLiveSyncing && "(Syncing...)"}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              href="/owner/transaksi"
              className="flex items-center gap-2 rounded-xl bg-[#FECB2F] px-4 py-2.5 text-sm font-bold text-[#222222] shadow-[0_0_15px_-5px_#FECB2F] transition-all hover:bg-[#e5b62a] active:scale-95"
            >
              <i className="fa-solid fa-cart-shopping"></i>
              <span>Buka POS Kasir</span>
            </Link>

            {transactions.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20 active:scale-95"
                title="Hapus seluruh riwayat transaksi"
              >
                <i className="fa-solid fa-trash-can"></i>
                <span className="hidden sm:inline">Bersihkan Semua</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                  <i className="fa-solid fa-magnifying-glass text-xs"></i>
                </span>
                <input
                  type="text"
                  value={searchHistory}
                  onChange={(e) => {
                    setSearchHistory(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari transaksi (ID, TikTok, Roblox, game)..."
                  className="w-full rounded-xl border border-white/10 bg-[#222222] pl-10 pr-9 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                />
                {searchHistory && (
                  <button
                    onClick={() => {
                      setSearchHistory("");
                      setCurrentPage(1);
                    }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
                  >
                    <i className="fa-solid fa-xmark text-sm"></i>
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter Status"
                className="rounded-xl border border-white/10 bg-[#222222] px-3.5 py-2.5 text-sm font-medium text-white outline-none transition focus:border-[#FECB2F]"
              >
                <option value="">Semua Status</option>
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.icon} {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh and Total Count */}
            <div className="flex items-center gap-3 self-end md:self-center">
              <button
                onClick={() => fetchData(true)}
                className="rounded-xl border border-white/10 bg-[#222222] px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#333] transition flex items-center gap-1.5 active:scale-95"
                title="Refresh data transaksi secara manual"
              >
                <i className={`fa-solid fa-arrows-rotate text-xs text-[#FECB2F] ${isLiveSyncing ? "animate-spin" : ""}`}></i>
                <span>Refresh</span>
              </button>
              <div className="text-xs text-zinc-400">
                Total: <span className="font-bold text-white">{filteredTransactions.length}</span> Transaksi
              </div>
            </div>
          </div>

          {/* Transactions Table with Live Status Controls & Kode Unik */}
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#222222] shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="border-b border-[#333] bg-[#1a1a1a] text-zinc-300">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Waktu & ID</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Game & Suplier</th>
                    <th className="px-6 py-4 font-semibold">Item Order</th>
                    <th className="px-6 py-4 font-semibold">Total Pay</th>
                    <th className="px-6 py-4 font-semibold">Live Status</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        Memuat riwayat transaksi...
                      </td>
                    </tr>
                  ) : paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-3xl">📭</span>
                          <p className="text-sm text-zinc-400 font-medium">Belum ada riwayat transaksi.</p>
                          <Link
                            href="/owner/transaksi"
                            className="mt-2 text-xs font-bold text-[#FECB2F] hover:underline"
                          >
                            + Buat Transaksi Baru di POS Kasir
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((trx) => {
                      const items = parseDataOrder(trx.data_order);
                      const isCompletedOrCanceled = ["selesai", "batal", "cancel"].includes((trx.status || "").toLowerCase());

                      return (
                        <tr key={trx.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-6 py-4">
                            <div className="font-mono text-xs text-white">
                              #{trx.id.substring(0, 8)}...
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              {new Date(trx.create_at).toLocaleString("id-ID", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">{trx.username_tiktok || "-"}</div>
                            <div className="text-xs text-zinc-400 mt-1 flex flex-col sm:flex-row sm:items-center gap-1.5">
                              <span>Roblox:</span>
                              {isCompletedOrCanceled ? (
                                <span className="text-[#FECB2F] font-semibold">{trx.username_roblox || "-"}</span>
                              ) : (
                                <input
                                  type="text"
                                  defaultValue={trx.username_roblox || ""}
                                  placeholder="Username Roblox"
                                  onBlur={(e) => {
                                    if (e.target.value !== (trx.username_roblox || "")) {
                                      handleUpdateRobloxUsername(trx.id, e.target.value);
                                    }
                                  }}
                                  className="px-2 py-1 rounded bg-[#1a1a1a] border border-white/10 text-[#FECB2F] font-semibold focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] outline-none text-xs w-full sm:w-32 transition-colors"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <span className="rounded bg-[#FECB2F]/20 text-[#FECB2F] px-2 py-0.5 text-xs mr-2 font-semibold">
                                {trx.game_name || "-"}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">
                              Suplier: <span className="text-zinc-300">{trx.suplier_name || "-"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-zinc-300 font-medium">
                              {items.length > 0 ? (
                                <span>
                                  {items[0].nama} {items[0].kuantitas > 1 ? `x${items[0].kuantitas}` : ""}
                                  {items.length > 1 && (
                                    <span className="text-zinc-500 ml-1">+{items.length - 1} item</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-zinc-500">-</span>
                              )}
                            </div>
                            {trx.diskon > 0 && (
                              <div className="text-[11px] text-emerald-400 mt-0.5">
                                Diskon: -Rp {Number(trx.diskon).toLocaleString("id-ID")}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            <div className="text-[#FECB2F]">
                              Rp {Number(trx.harga || 0).toLocaleString("id-ID")}
                            </div>
                            {Number(trx.kode_unik || 0) > 0 && (
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                (Kode: +{trx.kode_unik})
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={trx.status || "Pending"}
                              onChange={(e) => handleLiveStatusChange(trx.id, e.target.value)}
                              aria-label="Ubah Status Transaksi"
                              className="rounded-lg border border-white/10 bg-[#1a1a1a] px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-[#FECB2F] transition"
                            >
                              {STATUS_OPTIONS.map((st) => (
                                <option key={st.value} value={st.value}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View detail */}
                              <button
                                onClick={() => setSelectedTrxDetail(trx)}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition"
                                title="Lihat Rincian Transaksi"
                              >
                                <i className="fa-solid fa-eye text-sm"></i>
                              </button>

                              {!isCompletedOrCanceled && (
                                <>
                                  {/* Add product modal trigger */}
                                  <button
                                    onClick={() => openAddProdukModal(trx)}
                                    className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-[#FECB2F] transition"
                                    title="Tambah Produk ke Transaksi"
                                  >
                                    <i className="fa-solid fa-cart-plus text-sm"></i>
                                  </button>

                                  {/* Add discount modal trigger */}
                                  <button
                                    onClick={() => openAddDiscountModal(trx)}
                                    className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-emerald-400 transition"
                                    title="Tambah Potongan Diskon"
                                  >
                                    <i className="fa-solid fa-tags text-sm"></i>
                                  </button>
                                </>
                              )}

                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteTrx(trx.id)}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition"
                                title="Hapus Transaksi"
                              >
                                <i className="fa-solid fa-trash-can text-sm"></i>
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

            {/* Pagination Controls */}
            {filteredTransactions.length > 0 && (
              <div className="border-t border-[#333] px-6 py-4">
                <Pagination
                  currentPage={safeCurrentPage}
                  totalItems={filteredTransactions.length}
                  pageSize={pageSize}
                  onPageChange={(page) => setCurrentPage(page)}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Detail Transaksi */}
        {selectedTrxDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#222222] p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#333] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Detail Transaksi POS</h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">#{selectedTrxDetail.id}</p>
                </div>
                <button
                  onClick={() => setSelectedTrxDetail(null)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-zinc-500">Waktu Order:</span>
                  <p className="font-medium text-white mt-0.5">
                    {new Date(selectedTrxDetail.create_at).toLocaleString("id-ID")}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Status Saat Ini:</span>
                  <div className="mt-0.5">{getStatusBadge(selectedTrxDetail.status)}</div>
                </div>
                <div>
                  <span className="text-zinc-500">Username TikTok:</span>
                  <p className="font-medium text-white mt-0.5">{selectedTrxDetail.username_tiktok || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Username Roblox:</span>
                  <p className="font-semibold text-[#FECB2F] mt-0.5">{selectedTrxDetail.username_roblox || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Game:</span>
                  <p className="font-medium text-white mt-0.5">{selectedTrxDetail.game_name || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Suplier:</span>
                  <p className="font-medium text-white mt-0.5">{selectedTrxDetail.suplier_name || "-"}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Supplier Rate:</span>
                  <p className="font-medium text-white mt-0.5">{selectedTrxDetail.rate_robux_suplier || 0}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Rate Dijual:</span>
                  <p className="font-medium text-white mt-0.5">{selectedTrxDetail.rate_robux_dijual || 0}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-[#333] rounded-xl overflow-hidden">
                <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#333] text-xs font-bold text-zinc-300">
                  Rincian Item Pesanan
                </div>
                <div className="divide-y divide-[#333] p-2 max-h-48 overflow-y-auto">
                  {parseDataOrder(selectedTrxDetail.data_order).map((item, idx) => (
                    <div key={idx} className="p-2 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-white">{item.nama}</p>
                        <p className="text-zinc-500">{item.kuantitas} x Rp {Number(item.harga || 0).toLocaleString("id-ID")}</p>
                      </div>
                      <span className="font-bold text-white">
                        Rp {Number(item.subtotal || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="border-t border-[#333] pt-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal:</span>
                  <span className="text-white font-medium">Rp {Number(selectedTrxDetail.subtotal || 0).toLocaleString("id-ID")}</span>
                </div>
                {Number(selectedTrxDetail.diskon || 0) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Potongan Diskon:</span>
                    <span>- Rp {Number(selectedTrxDetail.diskon).toLocaleString("id-ID")}</span>
                  </div>
                )}
                {Number(selectedTrxDetail.kode_unik || 0) > 0 && (
                  <div className="flex justify-between text-[#FECB2F]">
                    <span>Sequential Unique Code:</span>
                    <span>+ Rp {selectedTrxDetail.kode_unik}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 flex justify-between text-base font-extrabold text-white">
                  <span>Total Tagihan:</span>
                  <span className="text-[#FECB2F]">Rp {Number(selectedTrxDetail.harga || 0).toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedTrxDetail(null)}
                  className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tambah Produk */}
        {addProdukModalTrx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#222222] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#333] pb-3">
                <h3 className="font-bold text-white text-base">Tambah Produk ke Transaksi</h3>
                <button
                  onClick={() => setAddProdukModalTrx(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Cari & Pilih Produk</label>
                <input
                  type="text"
                  placeholder="Ketik untuk filter nama produk..."
                  value={searchProdukModal}
                  onChange={(e) => setSearchProdukModal(e.target.value)}
                  className="w-full mb-2 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FECB2F]"
                />
                <select
                  value={selectedProdukToAdd}
                  onChange={(e) => setSelectedProdukToAdd(e.target.value)}
                  aria-label="Pilih Produk"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#FECB2F]"
                >
                  <option value="">-- Pilih Produk --</option>
                  {filteredProductsForModal.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama_produk} (Rp {Number(p.harga_jual).toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Jumlah (Qty)</label>
                <input
                  type="number"
                  min="1"
                  value={qtyToAdd}
                  onChange={(e) => setQtyToAdd(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#FECB2F]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#333]">
                <button
                  onClick={() => setAddProdukModalTrx(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddProdukSubmit}
                  disabled={!selectedProdukToAdd}
                  className="px-4 py-2 rounded-xl bg-[#FECB2F] text-black font-bold text-xs hover:bg-yellow-400 transition disabled:opacity-50"
                >
                  Tambahkan Produk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tambah Diskon */}
        {addDiscountModalTrx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#222]">
                <h3 className="font-bold text-white text-base">Beri Diskon Tambahan</h3>
                <button onClick={() => setAddDiscountModalTrx(null)} className="text-zinc-400 hover:text-white">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-2 p-1 bg-[#222] rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setAddDiscountType("nominal")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${addDiscountType === "nominal" ? "bg-[#FECB2F] text-black" : "text-zinc-400"}`}
                  >
                    Nominal (Rp)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddDiscountType("percent")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${addDiscountType === "percent" ? "bg-[#FECB2F] text-black" : "text-zinc-400"}`}
                  >
                    Persen (%)
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">
                    {addDiscountType === "nominal" ? "Nominal Diskon (Rp)" : "Persentase Diskon (%)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={addDiscountType === "percent" ? "100" : undefined}
                    value={addDiscountNominal || ""}
                    onChange={(e) => setAddDiscountNominal(Number(e.target.value))}
                    placeholder={addDiscountType === "nominal" ? "Contoh: 5000" : "Contoh: 10"}
                    className="w-full bg-[#222] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-[#FECB2F] outline-none"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    {addDiscountType === "percent"
                      ? `Bila ${addDiscountNominal || 0}%, potongannya Rp ${Math.floor((Number(addDiscountModalTrx.subtotal || 0) * (addDiscountNominal || 0)) / 100).toLocaleString("id-ID")}`
                      : "Diskon akan memotong subtotal transaksi ini."}
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-white/10 bg-[#222] flex justify-end gap-3">
                <button
                  onClick={() => setAddDiscountModalTrx(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    if (addDiscountNominal <= 0) return alert("Nominal diskon harus lebih dari 0");
                    if (addDiscountType === "percent" && addDiscountNominal > 100) return alert("Persentase diskon tidak boleh lebih dari 100%");

                    const finalDiscountAmount = addDiscountType === "percent"
                      ? Math.floor((Number(addDiscountModalTrx.subtotal || 0) * addDiscountNominal) / 100)
                      : addDiscountNominal;

                    if (finalDiscountAmount <= 0) return alert("Nilai potongan diskon tidak valid.");

                    try {
                      await applyDiscountToTransaksi(addDiscountModalTrx.id, finalDiscountAmount);
                      setAddDiscountModalTrx(null);
                      toast.success("Diskon berhasil ditambahkan!");
                      fetchData();
                    } catch (err: any) {
                      alert(err.message || "Gagal menambahkan diskon");
                    }
                  }}
                  disabled={addDiscountNominal <= 0}
                  className="px-4 py-2 rounded-xl bg-[#FECB2F] hover:bg-yellow-400 text-black font-bold text-sm transition disabled:opacity-50"
                >
                  Terapkan Diskon
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalTrx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] border border-red-500/30 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
              <div className="p-5 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500"></i>
                </div>
                <h3 className="font-bold text-white text-lg mb-2">Hapus Transaksi</h3>
                <p className="text-zinc-400 text-sm">
                  Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="p-4 border-t border-white/10 bg-[#222] flex gap-3">
                <button
                  onClick={() => setDeleteModalTrx(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteTransaction}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        <Toaster position="bottom-right" reverseOrder={false} />
      </div>
    </Sidebar>
  );
}
