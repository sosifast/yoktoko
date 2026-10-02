"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getDropdownDataForTransaksi,
  getTransaksi,
  createTransaksi,
  getNextKodeUnik,
  updateStatusTransaksi,
  deleteTransaksi,
} from "./actions";

interface OrderItem {
  id?: string;
  nama: string;
  kuantitas: number;
  harga: number;
  subtotal: number;
}

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending", icon: "⏳", color: "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:border-amber-500/60" },
  { value: "Bayar", label: "Bayar", icon: "💳", color: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:border-blue-500/60" },
  { value: "Kirim", label: "Kirim", icon: "📦", color: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:border-purple-500/60" },
  { value: "Selesai", label: "Selesai", icon: "✅", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60" },
  { value: "Batal", label: "Batal", icon: "❌", color: "bg-red-500/20 text-red-300 border-red-500/30 hover:border-red-500/60" },
];

export default function TransaksiPage() {
  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");

  // Step state for POS flow (Step 1: Pilih Produk, Step 2: Biaya & Form Lanjutan)
  const [posStep, setPosStep] = useState<1 | 2>(1);

  // Dropdowns & catalog
  const [categories, setCategories] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [supliers, setSupliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingKodeUnik, setLoadingKodeUnik] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [copiedNominal, setCopiedNominal] = useState(false);

  // Step 1: Catalog filters & Search
  const [selectedGameFilter, setSelectedGameFilter] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [productCatalogSearch, setProductCatalogSearch] = useState("");

  // Step 1: Cart
  const [cart, setCart] = useState<OrderItem[]>([]);

  // Step 2 & 3: Kode Unik (Sequential per price) & Form Lanjutan
  const [kodeUnik, setKodeUnik] = useState(0);
  const [usernameTiktok, setUsernameTiktok] = useState("");
  const [usernameRoblox, setUsernameRoblox] = useState("");
  const [selectedSuplier, setSelectedSuplier] = useState("");
  const [rateRobuxSuplier, setRateRobuxSuplier] = useState(0);
  const [rateRobuxDijual, setRateRobuxDijual] = useState(0);
  const [initialStatus, setInitialStatus] = useState("Pending");

  // History Tab: Search & Pagination
  const [searchHistory, setSearchHistory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedTrxDetail, setSelectedTrxDetail] = useState<any | null>(null);

  // Live polling state
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsLiveSyncing(true);

    try {
      const [dropdowns, trxList] = await Promise.all([
        getDropdownDataForTransaksi(),
        getTransaksi(),
      ]);
      setCategories(dropdowns.categories);
      setGames(dropdowns.games);
      setSupliers(dropdowns.supliers);
      setProducts(dropdowns.products);
      setTransactions(trxList);
    } catch (err) {
      console.error(err);
    }

    if (!silent) setLoading(false);
    else setIsLiveSyncing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live auto-refresh polling every 5 seconds for real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Subtotal of products in cart
  const subtotalHarga = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  // Final Total Bayar (Subtotal + Sequential Kode Unik 1-99)
  const totalBayar = useMemo(() => {
    return subtotalHarga + kodeUnik;
  }, [subtotalHarga, kodeUnik]);

  // Fetch sequential kode unik for current subtotal
  const handleProceedToStep2 = async () => {
    if (cart.length === 0) return;
    setLoadingKodeUnik(true);
    try {
      const nextCode = await getNextKodeUnik(subtotalHarga);
      setKodeUnik(nextCode);
      setPosStep(2);
    } catch (err) {
      console.error("Gagal mendapatkan kode unik:", err);
      setKodeUnik(1);
      setPosStep(2);
    }
    setLoadingKodeUnik(false);
  };

  const handleRefreshKode = async () => {
    setLoadingKodeUnik(true);
    try {
      const nextCode = await getNextKodeUnik(subtotalHarga);
      setKodeUnik(nextCode);
    } catch (err) {
      console.error(err);
    }
    setLoadingKodeUnik(false);
  };

  // Filter Catalog Products
  const filteredCatalogProducts = useMemo(() => {
    return products.filter((prod) => {
      if (selectedGameFilter && prod.id_game !== selectedGameFilter) return false;
      if (selectedCategoryFilter && prod.id_kategori !== selectedCategoryFilter) return false;
      if (productCatalogSearch.trim()) {
        const query = productCatalogSearch.toLowerCase().trim();
        const matchesName = prod.nama_produk?.toLowerCase().includes(query);
        const matchesSlug = prod.slug?.toLowerCase().includes(query);
        if (!matchesName && !matchesSlug) return false;
      }
      return true;
    });
  }, [products, selectedGameFilter, selectedCategoryFilter, productCatalogSearch]);

  // Cart operations
  const addToCart = (product: any) => {
    const existingIndex = cart.findIndex((item) => item.nama === product.nama_produk);
    const harga = Number(product.harga_jual) || 0;

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].kuantitas += 1;
      updated[existingIndex].subtotal = updated[existingIndex].kuantitas * updated[existingIndex].harga;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          nama: product.nama_produk,
          kuantitas: 1,
          harga: harga,
          subtotal: harga,
        },
      ]);
    }

    if (rateRobuxSuplier === 0 && Number(product.rate_robux_suplier) > 0) {
      setRateRobuxSuplier(Number(product.rate_robux_suplier));
    }
    if (rateRobuxDijual === 0 && Number(product.rate_robux_dijual) > 0) {
      setRateRobuxDijual(Number(product.rate_robux_dijual));
    }
  };

  const updateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const updated = [...cart];
    updated[index].kuantitas = newQty;
    updated[index].subtotal = newQty * updated[index].harga;
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Copy nominal to clipboard
  const handleCopyNominal = () => {
    navigator.clipboard.writeText(String(totalBayar));
    setCopiedNominal(true);
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  // Handle Checkout / Create Transaksi
  const handleProcessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Keranjang pesanan masih kosong! Silakan pilih produk terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const primaryProduct = products.find((p) => p.nama_produk === cart[0].nama);

      await createTransaksi({
        id_kategori: primaryProduct?.id_kategori || selectedCategoryFilter || null,
        id_game: primaryProduct?.id_game || selectedGameFilter || null,
        id_suplier: selectedSuplier || null,
        username_tiktok: usernameTiktok,
        username_roblox: usernameRoblox,
        subtotal: subtotalHarga,
        harga: totalBayar,
        rate_robux_suplier: Number(rateRobuxSuplier),
        rate_robux_dijual: Number(rateRobuxDijual),
        data_order: cart.map((item) => ({
          nama: item.nama,
          kuantitas: item.kuantitas,
          harga: item.harga,
          subtotal: item.subtotal,
        })),
        status: initialStatus,
        kode_unik: kodeUnik,
      });

      // Reset
      setCart([]);
      setKodeUnik(0);
      setUsernameTiktok("");
      setUsernameRoblox("");
      setInitialStatus("Pending");
      setPosStep(1);

      setSuccessMessage(`Transaksi berhasil disimpan! Total Bayar: Rp ${totalBayar.toLocaleString("id-ID")} (Kode Unik Urut: ${kodeUnik})`);
      setTimeout(() => setSuccessMessage(""), 6000);

      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal memproses transaksi. Coba lagi.");
    }
    setIsSubmitting(false);
  };

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
    } catch (err) {
      console.error("Gagal update status:", err);
      fetchData();
    }
  };

  // Delete Transaksi
  const handleDeleteTransaction = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data transaksi ini?")) {
      await deleteTransaksi(id);
      fetchData();
    }
  };

  // Filtered & Paginated History
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (searchHistory.trim()) {
        const query = searchHistory.toLowerCase().trim();
        const idMatch = t.id?.toLowerCase().includes(query);
        const ttMatch = t.username_tiktok?.toLowerCase().includes(query);
        const rbMatch = t.username_roblox?.toLowerCase().includes(query);
        const gameMatch = t.game_name?.toLowerCase().includes(query);
        const catMatch = t.kategori_name?.toLowerCase().includes(query);
        const supMatch = t.suplier_name?.toLowerCase().includes(query);
        const statMatch = t.status?.toLowerCase().includes(query);
        if (!idMatch && !ttMatch && !rbMatch && !gameMatch && !catMatch && !supMatch && !statMatch) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, searchHistory, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

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

  return (
    <Sidebar>
      <div className="p-8">
        {/* Header & Tabs */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">POS & Transaksi</h1>
              {/* Live sync pill */}
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Sync {isLiveSyncing && "(Syncing...)"}</span>
              </div>
            </div>
            <p className="mt-2 text-zinc-400">Kasir POS dengan kode unik urut per nominal dan live update status.</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#222222] p-1.5 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("pos")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                activeTab === "pos"
                  ? "bg-[#FECB2F] text-[#222222] shadow-[0_0_15px_-5px_#FECB2F]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>🛒</span>
              Kasir POS
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                activeTab === "history"
                  ? "bg-[#FECB2F] text-[#222222] shadow-[0_0_15px_-5px_#FECB2F]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>📋</span>
              Riwayat Transaksi ({transactions.length})
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-sm font-semibold text-emerald-400 shadow-lg">
            <div className="flex items-center gap-2.5">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setActiveTab("history")}
              className="text-xs text-white underline hover:text-[#FECB2F] font-bold"
            >
              Lihat di Riwayat &rarr;
            </button>
          </div>
        )}

        {/* TAB 1: KASIR POS */}
        {activeTab === "pos" && (
          <div className="space-y-6">
            {/* Stepper Progress Bar */}
            <div className="rounded-2xl border border-white/5 bg-[#222222] p-4 shadow-lg">
              <div className="flex items-center justify-between max-w-xl mx-auto">
                <div
                  onClick={() => setPosStep(1)}
                  className={`flex items-center gap-3 cursor-pointer transition ${
                    posStep === 1 ? "text-[#FECB2F]" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm ${
                      posStep === 1
                        ? "bg-[#FECB2F] text-[#222222] shadow-[0_0_12px_#FECB2F]"
                        : "bg-[#333] text-zinc-300"
                    }`}
                  >
                    1
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-bold">Langkah 1</p>
                    <p className="text-sm font-bold text-white">Menambahkan Produk</p>
                  </div>
                </div>

                <div className="h-0.5 w-16 sm:w-24 bg-white/10"></div>

                <div
                  onClick={() => {
                    if (cart.length > 0) handleProceedToStep2();
                  }}
                  className={`flex items-center gap-3 transition ${
                    posStep === 2
                      ? "text-[#FECB2F]"
                      : cart.length > 0
                      ? "text-zinc-400 hover:text-white cursor-pointer"
                      : "text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm ${
                      posStep === 2
                        ? "bg-[#FECB2F] text-[#222222] shadow-[0_0_12px_#FECB2F]"
                        : cart.length > 0
                        ? "bg-[#333] text-zinc-300"
                        : "bg-[#2a2a2a] text-zinc-600"
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-bold">Langkah 2</p>
                    <p className="text-sm font-bold text-white">Biaya Bayar & Form Lanjutan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 1: MENAMBAHKAN PRODUK */}
            {posStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Catalog Column */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                  {/* Search and Filters */}
                  <div className="rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative flex-1 w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          value={productCatalogSearch}
                          onChange={(e) => setProductCatalogSearch(e.target.value)}
                          placeholder="Cari produk di katalog..."
                          className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] pl-10 pr-9 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                        />
                        {productCatalogSearch && (
                          <button
                            onClick={() => setProductCatalogSearch("")}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <select
                        value={selectedGameFilter}
                        onChange={(e) => setSelectedGameFilter(e.target.value)}
                        aria-label="Filter berdasarkan Game"
                        className="w-full sm:w-auto rounded-xl border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-zinc-300 outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                      >
                        <option value="">Semua Game</option>
                        {games.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        aria-label="Filter berdasarkan Kategori"
                        className="w-full sm:w-auto rounded-xl border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-zinc-300 outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                      >
                        <option value="">Semua Kategori</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Product Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {loading ? (
                      <div className="col-span-full py-16 text-center text-zinc-500">
                        Memuat katalog produk...
                      </div>
                    ) : filteredCatalogProducts.length === 0 ? (
                      <div className="col-span-full rounded-2xl border border-white/5 bg-[#222222] p-12 text-center text-zinc-500">
                        Tidak ada produk yang cocok dengan filter atau pencarian.
                      </div>
                    ) : (
                      filteredCatalogProducts.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => addToCart(prod)}
                          className="group flex flex-col justify-between rounded-2xl border border-white/5 bg-[#222222] p-5 shadow-lg transition-all hover:-translate-y-1 hover:border-[#FECB2F]/40 cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="rounded bg-[#333] px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                                {categories.find((c) => c.id === prod.id_kategori)?.name || "Kategori"}
                              </span>
                              <span className="rounded bg-[#FECB2F]/15 px-2 py-0.5 text-[11px] font-semibold text-[#FECB2F]">
                                {games.find((g) => g.id === prod.id_game)?.name || "Game"}
                              </span>
                            </div>
                            <h3 className="font-bold text-white text-base group-hover:text-[#FECB2F] transition-colors">
                              {prod.nama_produk}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">
                              Robux: <span className="text-zinc-200 font-semibold">{prod.penggunaan_robux || 0} R$</span>
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-[#333] pt-3">
                            <span className="text-lg font-black text-white">
                              Rp {Number(prod.harga_jual).toLocaleString("id-ID")}
                            </span>
                            <span className="rounded-xl bg-[#FECB2F]/10 px-3 py-1 text-xs font-bold text-[#FECB2F] group-hover:bg-[#FECB2F] group-hover:text-[#222222] transition-colors">
                              + Tambah
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cart & Next Panel */}
                <div className="lg:col-span-5 xl:col-span-4">
                  <div className="sticky top-6 rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-2xl space-y-6">
                    <div className="flex items-center justify-between border-b border-[#333] pb-4">
                      <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <span>🛒</span> Keranjang Produk
                      </h2>
                      <span className="text-xs font-semibold rounded-full bg-[#333] px-2.5 py-1 text-zinc-400">
                        {cart.reduce((sum, item) => sum + item.kuantitas, 0)} item
                      </span>
                    </div>

                    {/* Cart Items List */}
                    {cart.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#444] p-8 text-center text-xs text-zinc-500 space-y-2">
                        <span className="text-3xl block">📦</span>
                        <p className="font-semibold text-zinc-400">Keranjang masih kosong</p>
                        <p>Klik produk di sebelah kiri untuk menambahkannya ke keranjang</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {cart.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl bg-[#1a1a1a] p-3 text-xs"
                          >
                            <div className="flex-1 pr-2">
                              <p className="font-bold text-white line-clamp-1">{item.nama}</p>
                              <p className="text-zinc-400 text-[11px] mt-0.5">
                                Rp {item.harga.toLocaleString("id-ID")}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateCartQty(idx, item.kuantitas - 1)}
                                className="h-6 w-6 rounded-lg bg-[#333] text-white hover:bg-[#444] font-bold"
                              >
                                -
                              </button>
                              <span className="font-bold text-white min-w-4 text-center">
                                {item.kuantitas}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(idx, item.kuantitas + 1)}
                                className="h-6 w-6 rounded-lg bg-[#333] text-white hover:bg-[#444] font-bold"
                              >
                                +
                              </button>
                            </div>

                            <div className="text-right pl-3">
                              <span className="font-bold text-white block">
                                Rp {item.subtotal.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Subtotal & Next Button */}
                    <div className="border-t border-[#333] pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-zinc-400">Subtotal Item</span>
                        <span className="text-2xl font-black text-[#FECB2F]">
                          Rp {subtotalHarga.toLocaleString("id-ID")}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={cart.length === 0 || loadingKodeUnik}
                        onClick={handleProceedToStep2}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FECB2F] py-3.5 text-sm font-bold text-[#222222] shadow-[0_0_20px_-5px_#FECB2F] transition-all hover:bg-[#e5b62a] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {loadingKodeUnik ? (
                          <span>Menghitung Kode Urut...</span>
                        ) : (
                          <>
                            <span>Lanjut ke Pembayaran & Form (Next)</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 & 3: BIAYA YANG HARUS DIBAYARKAN (KODE UNIK URUT 1-99) + FORM LANJUTAN */}
            {posStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Biaya yang Harus Dibayarkan dengan Kode Unik Urut */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Big Total Payment Banner with Sequential Kode Unik */}
                  <div className="rounded-2xl border-2 border-[#FECB2F] bg-gradient-to-br from-[#FECB2F]/20 via-[#222222] to-[#1a1a1a] p-6 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase font-extrabold tracking-wider text-[#FECB2F] flex items-center gap-1.5">
                        <span>💰</span> TOTAL BIAYA HARUS DIBAYARKAN
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyNominal}
                        className="rounded-lg bg-[#FECB2F]/20 hover:bg-[#FECB2F]/30 text-[#FECB2F] border border-[#FECB2F]/40 px-2.5 py-1 text-xs font-bold transition flex items-center gap-1"
                        title="Salin nominal transfer tepat"
                      >
                        {copiedNominal ? "✓ Tersalin!" : "📋 Salin Nominal"}
                      </button>
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                        Rp {totalBayar.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {/* Breakdown box */}
                    <div className="mt-4 rounded-xl bg-black/40 border border-white/10 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-zinc-300">
                        <span>Subtotal Produk:</span>
                        <span className="font-semibold text-white">Rp {subtotalHarga.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <span>Kode Unik Urut (1-99):</span>
                          <button
                            type="button"
                            onClick={handleRefreshKode}
                            disabled={loadingKodeUnik}
                            className="text-[#FECB2F] hover:underline text-[11px] font-bold"
                            title="Cek ulang kode urut berikutnya"
                          >
                            {loadingKodeUnik ? "..." : "🔄 Cek Urutan"}
                          </button>
                        </span>
                        <span className="font-bold text-[#FECB2F] bg-[#FECB2F]/15 px-2.5 py-0.5 rounded-lg border border-[#FECB2F]/30">
                          + Rp {kodeUnik}
                        </span>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex justify-between items-center text-white font-bold">
                        <span>Total Bayar Persis:</span>
                        <span className="text-base text-[#FECB2F]">Rp {totalBayar.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-[#FECB2F]/10 border border-[#FECB2F]/20 p-2.5 text-[11px] text-zinc-300">
                      💡 <strong>Kode urut aktif:</strong> Untuk produk seharga <strong>Rp {subtotalHarga.toLocaleString("id-ID")}</strong>, kode unik berlanjut ke nomor <strong>{kodeUnik}</strong> (misal 5001 &rarr; 5002, 8000 &rarr; 8001).
                    </div>
                  </div>

                  {/* Order Items Breakdown */}
                  <div className="rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-[#333] pb-3">
                      <h3 className="font-bold text-white text-base">Rincian Item Pesanan</h3>
                      <button
                        onClick={() => setPosStep(1)}
                        className="text-xs font-semibold text-[#FECB2F] hover:underline flex items-center gap-1"
                      >
                        &larr; Ubah / Tambah Produk
                      </button>
                    </div>

                    <div className="divide-y divide-[#333]">
                      {cart.map((item, idx) => (
                        <div key={idx} className="py-3 flex justify-between items-center text-sm">
                          <div>
                            <p className="font-semibold text-white">{item.nama}</p>
                            <p className="text-xs text-zinc-400">
                              {item.kuantitas} x Rp {item.harga.toLocaleString("id-ID")}
                            </p>
                          </div>
                          <span className="font-bold text-white">
                            Rp {item.subtotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#333] pt-4 flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Subtotal Item</span>
                      <span className="font-semibold text-white">Rp {subtotalHarga.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Kode Unik Konfirmasi (Urut)</span>
                      <span className="font-bold text-[#FECB2F]">+ Rp {kodeUnik}</span>
                    </div>
                    <div className="border-t border-[#333] pt-3 flex justify-between items-center">
                      <span className="font-extrabold text-white">Total Tagihan</span>
                      <span className="text-2xl font-black text-[#FECB2F]">
                        Rp {totalBayar.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Form Lanjutan & Konfirmasi */}
                <div className="lg:col-span-6">
                  <div className="rounded-2xl border border-white/5 bg-[#222222] p-7 shadow-2xl space-y-6">
                    <div className="border-b border-[#333] pb-4">
                      <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <span>📝</span> Form Lanjutan Transaksi
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">Lengkapi data pembeli, suplier, dan status awal transaksi.</p>
                    </div>

                    <form onSubmit={handleProcessOrder} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Username TikTok <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={usernameTiktok}
                          onChange={(e) => setUsernameTiktok(e.target.value)}
                          placeholder="Contoh: @tokokita_official"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Username Roblox <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={usernameRoblox}
                          onChange={(e) => setUsernameRoblox(e.target.value)}
                          placeholder="Contoh: player_roblox123"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Pilih Suplier
                        </label>
                        <select
                          value={selectedSuplier}
                          onChange={(e) => setSelectedSuplier(e.target.value)}
                          aria-label="Pilih Suplier"
                          className="mt-1 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                        >
                          <option value="">-- Pilih Suplier (Opsional) --</option>
                          {supliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-zinc-400">Rate Suplier</label>
                          <input
                            type="number"
                            step="0.01"
                            value={rateRobuxSuplier}
                            onChange={(e) => setRateRobuxSuplier(Number(e.target.value))}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-400">Rate Dijual</label>
                          <input
                            type="number"
                            step="0.01"
                            value={rateRobuxDijual}
                            onChange={(e) => setRateRobuxDijual(Number(e.target.value))}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                          />
                        </div>
                      </div>

                      {/* Kode Unik input (shows current sequential code, editable if required) */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                            Kode Unik Urut (1 - 99)
                          </label>
                          <button
                            type="button"
                            onClick={handleRefreshKode}
                            disabled={loadingKodeUnik}
                            className="text-xs text-[#FECB2F] hover:underline font-bold"
                          >
                            {loadingKodeUnik ? "Memuat..." : "🔄 Cek Urutan Terkini"}
                          </button>
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          required
                          value={kodeUnik}
                          onChange={(e) => {
                            const val = Math.min(99, Math.max(1, Number(e.target.value) || 1));
                            setKodeUnik(val);
                          }}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm font-bold text-[#FECB2F] outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                        />
                      </div>

                      {/* Initial Status Selector */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">
                          Status Awal Transaksi
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {STATUS_OPTIONS.map((st) => (
                            <button
                              key={st.value}
                              type="button"
                              onClick={() => setInitialStatus(st.value)}
                              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                                initialStatus === st.value
                                  ? `${st.color} ring-2 ring-[#FECB2F]`
                                  : "border-white/5 bg-[#1a1a1a] text-zinc-400 hover:text-white"
                              }`}
                            >
                              <span className="text-base">{st.icon}</span>
                              <span className="mt-1">{st.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="border-t border-[#333] pt-6 flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => setPosStep(1)}
                          className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-[#333] transition"
                        >
                          &larr; Kembali
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting || loadingKodeUnik}
                          className="flex-1 rounded-xl bg-[#FECB2F] py-3.5 px-6 text-sm font-bold text-[#222222] shadow-[0_0_20px_-5px_#FECB2F] transition-all hover:bg-[#e5b62a] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSubmitting ? "Menyimpan Transaksi..." : `⚡ Simpan Transaksi (Rp ${totalBayar.toLocaleString("id-ID")})`}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RIWAYAT TRANSAKSI DENGAN LIVE UPDATE STATUS */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
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
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
                  aria-label="Filter status transaksi"
                  className="rounded-xl border border-white/10 bg-[#222222] px-3.5 py-2.5 text-sm text-zinc-300 outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                >
                  <option value="">Semua Status</option>
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.icon} {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                <button
                  onClick={() => fetchData(true)}
                  className="rounded-xl border border-white/10 bg-[#222222] px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#333] transition flex items-center gap-1.5"
                  title="Refresh data transaksi secara manual"
                >
                  <svg className={`w-3.5 h-3.5 ${isLiveSyncing ? "animate-spin text-[#FECB2F]" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
                <div className="text-xs text-zinc-400">
                  Total: <span className="font-bold text-white">{filteredTransactions.length}</span>
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
                      <th className="px-6 py-4 font-semibold">Total Bayar</th>
                      <th className="px-6 py-4 font-semibold">Live Status</th>
                      <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          Memuat riwayat transaksi...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          {searchHistory || statusFilter
                            ? "Tidak ada transaksi yang cocok dengan filter."
                            : "Belum ada transaksi tersimpan."}
                        </td>
                      </tr>
                    ) : (
                      paginatedTransactions.map((trx) => {
                        const items = parseDataOrder(trx.data_order);
                        return (
                          <tr key={trx.id} className="hover:bg-[#2a2a2a] transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs text-zinc-300">
                                {trx.id.substring(0, 8)}...
                              </span>
                              <div className="text-[11px] text-zinc-500 mt-0.5">
                                {new Date(trx.create_at).toLocaleString("id-ID", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-white">{trx.username_tiktok || "-"}</div>
                              <div className="text-xs text-zinc-400">
                                Roblox: <span className="text-[#FECB2F]">{trx.username_roblox || "-"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <span className="rounded bg-[#FECB2F]/20 text-[#FECB2F] px-2 py-0.5 text-xs mr-2">
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
                                  "-"
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-white block">
                                Rp {Number(trx.harga).toLocaleString("id-ID")}
                              </span>
                              {trx.kode_unik > 0 && (
                                <span className="text-[11px] font-semibold text-[#FECB2F] bg-[#FECB2F]/10 px-1.5 py-0.5 rounded border border-[#FECB2F]/20 inline-block mt-0.5">
                                  Kode: +{trx.kode_unik}
                                </span>
                              )}
                            </td>
                            {/* Live Status Selector */}
                            <td className="px-6 py-4">
                              <select
                                value={trx.status || "Pending"}
                                onChange={(e) => handleLiveStatusChange(trx.id, e.target.value)}
                                aria-label="Ubah Status Transaksi"
                                className={`rounded-xl border px-3 py-1.5 text-xs font-bold outline-none cursor-pointer transition ${
                                  STATUS_OPTIONS.find((s) => s.value.toLowerCase() === (trx.status || "").toLowerCase())?.color ||
                                  "bg-[#1a1a1a] text-zinc-300 border-white/10"
                                }`}
                              >
                                {STATUS_OPTIONS.map((st) => (
                                  <option key={st.value} value={st.value} className="bg-[#222222] text-white">
                                    {st.icon} {st.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right space-x-3">
                              <button
                                onClick={() => setSelectedTrxDetail(trx)}
                                className="text-[#FECB2F] hover:underline font-semibold text-xs"
                              >
                                Detail
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(trx.id)}
                                className="text-red-500 hover:underline font-semibold text-xs"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && filteredTransactions.length > 0 && (
                <Pagination
                  currentPage={safeCurrentPage}
                  totalItems={filteredTransactions.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Modal Detail Transaksi */}
        {selectedTrxDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#222222] p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Detail Transaksi</h3>
                  <p className="font-mono text-xs text-zinc-400 mt-1">ID: {selectedTrxDetail.id}</p>
                </div>
                <button
                  onClick={() => setSelectedTrxDetail(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-[#333] hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-sm text-zinc-300">
                {/* Live Status Bar inside modal */}
                <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-500 block">Status Saat Ini</span>
                    <div className="mt-1">{getStatusBadge(selectedTrxDetail.status)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block mb-1">Ganti Status Langsung:</span>
                    <select
                      value={selectedTrxDetail.status || "Pending"}
                      onChange={(e) => handleLiveStatusChange(selectedTrxDetail.id, e.target.value)}
                      aria-label="Ubah Status Transaksi Modal"
                      className="rounded-xl border border-white/10 bg-[#222222] px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-[#FECB2F]"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st.value} value={st.value} className="bg-[#222222] text-white">
                          {st.icon} {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#1a1a1a] p-4">
                  <div>
                    <span className="text-xs text-zinc-500 block">TikTok</span>
                    <span className="font-semibold text-white">{selectedTrxDetail.username_tiktok || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Roblox</span>
                    <span className="font-semibold text-[#FECB2F]">{selectedTrxDetail.username_roblox || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Game</span>
                    <span className="font-semibold text-white">{selectedTrxDetail.game_name || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Suplier</span>
                    <span className="font-semibold text-white">{selectedTrxDetail.suplier_name || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Rate Suplier</span>
                    <span className="font-semibold text-white">{selectedTrxDetail.rate_robux_suplier || 0}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Rate Dijual</span>
                    <span className="font-semibold text-white">{selectedTrxDetail.rate_robux_dijual || 0}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-zinc-400 mb-2">Item Terbeli (Data Order)</h4>
                  <div className="rounded-xl border border-white/5 bg-[#1a1a1a] divide-y divide-[#333]">
                    {parseDataOrder(selectedTrxDetail.data_order).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 text-xs">
                        <div>
                          <p className="font-bold text-white">{item.nama}</p>
                          <p className="text-zinc-500">Qty: {item.kuantitas}</p>
                        </div>
                        <span className="font-bold text-white">
                          Rp {(item.subtotal || item.harga * item.kuantitas || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal & Kode Unik Breakdown */}
                {selectedTrxDetail.kode_unik > 0 && (
                  <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-3 text-xs flex justify-between items-center">
                    <span className="text-zinc-400">Kode Unik Konfirmasi (Urut)</span>
                    <span className="font-bold text-[#FECB2F] bg-[#FECB2F]/15 px-2 py-0.5 rounded border border-[#FECB2F]/30">
                      +{selectedTrxDetail.kode_unik}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-[#333] pt-4">
                  <span className="text-sm font-bold text-zinc-400">Total Pembayaran</span>
                  <span className="text-xl font-black text-[#FECB2F]">
                    Rp {Number(selectedTrxDetail.harga).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedTrxDetail(null)}
                  className="rounded-xl bg-[#333] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#444] transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
