"use client";

import Sidebar from "@/app/components/Sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  getDropdownDataForTransaksi,
  createTransaksi,
  getNextKodeUnik,
  checkRobloxAccount,
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
  { value: "Pay", label: "Pay", icon: "💳", color: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:border-blue-500/60" },
  { value: "Kirim", label: "Kirim", icon: "📦", color: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:border-purple-500/60" },
  { value: "Selesai", label: "Selesai", icon: "✅", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60" },
  { value: "Cancel", label: "Cancel", icon: "❌", color: "bg-red-500/20 text-red-300 border-red-500/30 hover:border-red-500/60" },
];

export default function POSTransaksiPage() {
  const router = useRouter();
  // Step state for POS flow (Step 1: Select Product, Step 2: Biaya & Form Lanjutan)
  const [posStep, setPosStep] = useState<1 | 2>(1);

  // Dropdowns & catalog
  const [categories, setCategories] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [supliers, setSupliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingKodeUnik, setLoadingKodeUnik] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [copiedNominal, setCopiedNominal] = useState(false);

  // Step 1: Catalog Game Tab, Category Filter & Search
  const [selectedGameFilter, setSelectedGameFilter] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [productCatalogSearch, setProductCatalogSearch] = useState("");

  // Step 1: Cart
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [discountType, setDiscountType] = useState<"nominal" | "percent">("nominal");
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Step 2 & 3: Kode Unik (Sequential per price) & Form Lanjutan
  const [kodeUnik, setKodeUnik] = useState(0);
  const [usernameTiktok, setUsernameTiktok] = useState("");
  const [usernameRoblox, setUsernameRoblox] = useState("");
  const [checkingRoblox, setCheckingRoblox] = useState(false);
  const [verifiedRoblox, setVerifiedRoblox] = useState<{
    id: number;
    name: string;
    displayName: string;
    avatarUrl: string;
  } | null>(null);
  const [selectedSuplier, setSelectedSuplier] = useState("");
  const [rateRobuxSuplier, setRateRobuxSuplier] = useState(0);
  const [rateRobuxDijual, setRateRobuxDijual] = useState(0);
  const [initialStatus, setInitialStatus] = useState("Pending");

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const dropdowns = await getDropdownDataForTransaksi();
      setCategories(dropdowns.categories);
      setGames(dropdowns.games);
      setSupliers(dropdowns.supliers);
      setProducts(dropdowns.products);
      if (dropdowns.games && dropdowns.games.length > 0) {
        setSelectedGameFilter((prev) => prev || dropdowns.games[0].id);
      }
    } catch (err) {
      console.error("Failed memuat data awal:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Subtotal of products in cart
  const originalSubtotalHarga = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  const subtotalHarga = useMemo(() => {
    let sub = originalSubtotalHarga;
    if (discountType === "nominal") {
      sub -= discountValue;
    } else if (discountType === "percent") {
      sub -= (sub * discountValue) / 100;
    }
    return Math.max(0, sub);
  }, [originalSubtotalHarga, discountType, discountValue]);

  // Final Total Pay (Subtotal + Sequential Kode Unik 1-99)
  const totalPay = useMemo(() => {
    return subtotalHarga + kodeUnik;
  }, [subtotalHarga, kodeUnik]);

  // Fetch sequential kode unik for current subtotal only while on Step 1
  useEffect(() => {
    if (posStep !== 1) return;
    if (cart.length === 0 || subtotalHarga <= 0) {
      setKodeUnik(0);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setLoadingKodeUnik(true);
      try {
        const nextCode = await getNextKodeUnik(subtotalHarga);
        if (!isCancelled) {
          setKodeUnik(nextCode);
        }
      } catch (err) {
        console.error("Gagal mendapatkan sequential kode unik:", err);
      } finally {
        if (!isCancelled) setLoadingKodeUnik(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [subtotalHarga, cart.length, posStep]);

  // Handle Step 1 -> Step 2
  const handleProceedToStep2 = async () => {
    if (cart.length === 0) {
      toast.error("Keranjang masih kosong!");
      return;
    }

    setLoadingKodeUnik(true);
    try {
      const nextCode = await getNextKodeUnik(subtotalHarga);
      setKodeUnik(nextCode);
      setPosStep(2);
    } catch (err) {
      console.error("Failed get kode unik:", err);
      setPosStep(2);
    } finally {
      setLoadingKodeUnik(false);
    }
  };

  const handleRefreshKode = async () => {
    if (subtotalHarga <= 0) return;
    setLoadingKodeUnik(true);
    try {
      const nextCode = await getNextKodeUnik(subtotalHarga);
      setKodeUnik(nextCode);
      toast.success(`Kode unik diperbarui: +Rp ${nextCode}`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengambil urutan kode unik");
    } finally {
      setLoadingKodeUnik(false);
    }
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
    navigator.clipboard.writeText(String(totalPay));
    setCopiedNominal(true);
    toast.success(`Nominal transfer Rp ${totalPay.toLocaleString("id-ID")} disalin!`);
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  // Handle Checkout / Create Transaksi
  const handleProcessOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cart.length === 0) {
      toast.error("Keranjang belanja kosong! Silakan pilih produk terlebih dahulu.");
      setPosStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const primaryProduct = products.find((p) => p.nama_produk === cart[0].nama);
      const discountNominal = originalSubtotalHarga - subtotalHarga;

      const res = await createTransaksi({
        id_kategori: primaryProduct?.id_kategori || selectedCategoryFilter || null,
        id_game: primaryProduct?.id_game || selectedGameFilter || null,
        id_suplier: selectedSuplier || null,
        username_tiktok: usernameTiktok.trim(),
        username_roblox: usernameRoblox.trim(),
        subtotal: subtotalHarga,
        harga: totalPay,
        rate_robux_suplier: Number(rateRobuxSuplier) || 0,
        rate_robux_dijual: Number(rateRobuxDijual) || 0,
        data_order: [
          ...cart.map((item) => ({
            nama: item.nama,
            kuantitas: item.kuantitas,
            harga: item.harga,
            subtotal: item.subtotal,
          })),
          ...(discountNominal > 0
            ? [
                {
                  nama: `Discount (${discountType === "percent" ? discountValue + "%" : "Nominal"})`,
                  kuantitas: 1,
                  harga: -discountNominal,
                  subtotal: -discountNominal,
                },
              ]
            : []),
        ],
        status: initialStatus,
        kode_unik: Number(kodeUnik) || 0,
        diskon: discountNominal,
      });

      // Reset Form State
      setCart([]);
      setKodeUnik(0);
      setUsernameTiktok("");
      setUsernameRoblox("");
      setVerifiedRoblox(null);
      setSelectedSuplier("");
      setDiscountValue(0);
      setInitialStatus("Pending");
      setPosStep(1);

      toast.success(`Transaksi berhasil disimpan! Mengalihkan ke detail...`, {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });

      if (res?.id) {
        router.push(`/owner/transaksi/${res.id}/trx`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal memproses transaksi. Coba lagi.", {
        style: {
          borderRadius: "10px",
          background: "#222",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check Roblox Account via API
  const handleCheckRoblox = async () => {
    if (checkingRoblox) return;
    const q = usernameRoblox.trim();
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
      setUsernameRoblox(res.user.name);
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



  return (
    <Sidebar>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">POS Kasir Transaksi</h1>
              <span className="rounded-lg bg-[#FECB2F]/20 text-[#FECB2F] border border-[#FECB2F]/30 px-2.5 py-0.5 text-xs font-bold">
                {posStep === 1 ? "Step 1: Pilih Produk" : "Step 2: Konfirmasi & Simpan"}
              </span>
            </div>
          </div>

          {/* Link to History Page */}
          <Link
            href="/owner/transaksi/history"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#222222] px-4 py-2.5 text-sm font-bold text-zinc-300 hover:text-white hover:bg-[#333] transition-all self-start md:self-auto"
          >
            <i className="fa-solid fa-receipt text-[#FECB2F]"></i>
            <span>Buka Riwayat Transaksi &rarr;</span>
          </Link>
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
            <Link
              href="/owner/transaksi/history"
              className="text-xs text-white underline hover:text-[#FECB2F] font-bold"
            >
              Lihat di Riwayat &rarr;
            </Link>
          </div>
        )}

        {/* STEP 1: MENAMBAHKAN PRODUK KE KERANJANG */}
        {posStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Catalog Column */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* Game Tabs & Search + Category Filter */}
              <div className="space-y-3">
                {/* Game Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                  {games.map((g) => {
                    const count = products.filter((p) => p.id_game === g.id).length;
                    const isSelected = selectedGameFilter === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGameFilter(g.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${
                          isSelected
                            ? "bg-[#FECB2F] text-[#222222] border-[#FECB2F] shadow-[0_0_15px_-5px_#FECB2F]"
                            : "bg-[#222222] text-zinc-400 border-white/5 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span>🎮</span>
                        <span>{g.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                            isSelected ? "bg-black/20 text-[#222222]" : "bg-white/5 text-zinc-500"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                      <i className="fa-solid fa-magnifying-glass text-xs"></i>
                    </span>
                    <input
                      type="text"
                      value={productCatalogSearch}
                      onChange={(e) => setProductCatalogSearch(e.target.value)}
                      placeholder="Cari produk kasir..."
                      className="w-full rounded-xl border border-white/10 bg-[#222222] pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-[#FECB2F]"
                    />
                  </div>

                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    aria-label="Pilih Kategori"
                    className="rounded-xl border border-white/10 bg-[#222222] px-3.5 py-2.5 text-xs font-medium text-white outline-none transition focus:border-[#FECB2F]"
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

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? (
                  <div className="col-span-full py-12 text-center text-zinc-500">
                    Memuat katalog produk...
                  </div>
                ) : filteredCatalogProducts.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-zinc-500">
                    Tidak ada produk ditemukan untuk game/kategori ini.
                  </div>
                ) : (
                  filteredCatalogProducts.map((p) => {
                    const inCartItem = cart.find((c) => c.nama === p.nama_produk);
                    const qty = inCartItem?.kuantitas || 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className={`group cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                          qty > 0
                            ? "border-[#FECB2F] bg-[#222222] shadow-[0_0_15px_-5px_#FECB2F]/20"
                            : "border-white/5 bg-[#222222] hover:border-white/20 hover:bg-[#282828]"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                              {p.tipe_produk || "Item"}
                            </span>
                            {qty > 0 && (
                              <span className="rounded-full bg-[#FECB2F] px-2 py-0.5 text-[10px] font-black text-[#222222]">
                                {qty}x
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-white text-sm mt-1 line-clamp-2 group-hover:text-[#FECB2F] transition-colors">
                            {p.nama_produk}
                          </h4>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-[#FECB2F]">
                            Rp {Number(p.harga_jual || 0).toLocaleString("id-ID")}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm ${
                              qty > 0
                                ? "bg-[#FECB2F] text-[#222222] hover:bg-[#e5b62a] shadow-[0_0_10px_-2px_#FECB2F]"
                                : "bg-[#FECB2F]/15 text-[#FECB2F] border border-[#FECB2F]/30 hover:bg-[#FECB2F] hover:text-[#222222]"
                            }`}
                          >
                            <span>+</span>
                            <span>Tambah</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cart & Customer Section */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              <div className="rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-xl space-y-6 sticky top-6">
                <div className="border-b border-[#333] pb-4 flex items-center justify-between">
                  <h3 className="font-black text-lg text-white flex items-center gap-2">
                    <span>🛒</span> Keranjang Transaksi
                  </h3>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {/* Optional Buyer TikTok Username */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400">Username TikTok Buyer (Opsional)</label>
                  <input
                    type="text"
                    value={usernameTiktok}
                    onChange={(e) => setUsernameTiktok(e.target.value)}
                    placeholder="Contoh: @buyer_store"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                  />
                </div>

                {/* Cart Items List */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-[#333]">
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      Keranjang masih kosong. Klik produk di katalog untuk menambahkan.
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate">{item.nama}</p>
                          <p className="text-zinc-400">Rp {item.harga.toLocaleString("id-ID")}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, item.kuantitas - 1)}
                            className="w-6 h-6 rounded-lg bg-[#333] text-white flex items-center justify-center font-bold hover:bg-[#444]"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-white">{item.kuantitas}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, item.kuantitas + 1)}
                            className="w-6 h-6 rounded-lg bg-[#333] text-white flex items-center justify-center font-bold hover:bg-[#444]"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-white text-right min-w-[70px]">
                          Rp {item.subtotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Discount Feature */}
                {cart.length > 0 && (
                  <div className="pt-3 border-t border-[#333] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Beri Potongan Diskon</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setDiscountType("nominal")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            discountType === "nominal" ? "bg-[#FECB2F] text-black" : "bg-[#333] text-zinc-400"
                          }`}
                        >
                          Rp
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType("percent")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            discountType === "percent" ? "bg-[#FECB2F] text-black" : "bg-[#333] text-zinc-400"
                          }`}
                        >
                          %
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={discountValue || ""}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                      placeholder={discountType === "nominal" ? "Nominal (Rp)" : "Persentase (%)"}
                      className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3.5 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#FECB2F]"
                    />
                  </div>
                )}

                {/* Calculation Summary */}
                <div className="border-t border-[#333] pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal Produk:</span>
                    <span className="text-white font-semibold">Rp {originalSubtotalHarga.toLocaleString("id-ID")}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Potongan Diskon:</span>
                      <span>
                        - Rp{" "}
                        {(originalSubtotalHarga - subtotalHarga).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <span>Sequential Kode Unik (1-99):</span>
                      <button
                        type="button"
                        onClick={handleRefreshKode}
                        disabled={loadingKodeUnik}
                        className="text-[#FECB2F] hover:underline text-[10px] font-bold"
                        title="Recheck nomor urut sequential kode berikutnya"
                      >
                        {loadingKodeUnik ? "..." : "🔄 Cek"}
                      </button>
                    </span>
                    <span className="font-bold text-[#FECB2F] bg-[#FECB2F]/15 px-2 py-0.5 rounded border border-[#FECB2F]/30">
                      + Rp {kodeUnik}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between items-center text-base font-black text-white">
                    <span>Total Pembayaran:</span>
                    <span className="text-xl text-[#FECB2F]">
                      Rp {totalPay.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Step 1 Checkout Button */}
                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  disabled={cart.length === 0 || loadingKodeUnik}
                  className="w-full rounded-xl bg-[#FECB2F] py-3.5 px-6 text-sm font-bold text-[#222222] shadow-[0_0_20px_-5px_#FECB2F] transition-all hover:bg-[#e5b62a] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingKodeUnik ? "Loading..." : "Next →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: FORM LANJUTAN TRANSAKSI (BUYER DATA, SUPLIER, STATUS) */}
        {posStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Ringkasan Tagihan & Nomor Urut */}
              <div className="lg:col-span-6 space-y-6">
                <div className="rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-xl space-y-4">
                  <div className="border-b border-[#333] pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Ringkasan Tagihan</span>
                      <h3 className="text-lg font-black text-white">Kode Unik & Total Bayar</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyNominal}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition flex items-center gap-1.5"
                    >
                      <span>{copiedNominal ? "✓ Tersalin" : "📋 Salin Total"}</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-zinc-400">
                      <span>Subtotal Produk:</span>
                      <span className="font-semibold text-white">Rp {subtotalHarga.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <span>Sequential Unique Code (1-99):</span>
                        <button
                          type="button"
                          onClick={handleRefreshKode}
                          disabled={loadingKodeUnik}
                          className="text-[#FECB2F] hover:underline text-[11px] font-bold"
                          title="Recheck sequential code berikutnya"
                        >
                          {loadingKodeUnik ? "..." : "🔄 Cek Urutan"}
                        </button>
                      </span>
                      <span className="font-bold text-[#FECB2F] bg-[#FECB2F]/15 px-2.5 py-0.5 rounded-lg border border-[#FECB2F]/30">
                        + Rp {kodeUnik}
                      </span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between items-center text-white font-bold">
                      <span>Exact Total Pay:</span>
                      <span className="text-base text-[#FECB2F]">Rp {totalPay.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-[#FECB2F]/10 border border-[#FECB2F]/20 p-2.5 text-[11px] text-zinc-300">
                    💡 <strong>Kode urut aktif:</strong> Untuk subtotal <strong>Rp {subtotalHarga.toLocaleString("id-ID")}</strong>, kode unik yang disematkan adalah <strong>+{kodeUnik}</strong> (Total transfer pembeli: <strong>Rp {totalPay.toLocaleString("id-ID")}</strong>).
                  </div>
                </div>

                {/* Order Items Breakdown */}
                <div className="rounded-2xl border border-white/5 bg-[#222222] p-6 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <h3 className="font-bold text-white text-base">Rincian Item Pesanan</h3>
                    <button
                      type="button"
                      onClick={() => setPosStep(1)}
                      className="text-xs font-semibold text-[#FECB2F] hover:underline flex items-center gap-1"
                    >
                      &larr; Tambah / Ubah Produk
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
                    {discountValue > 0 && (
                      <div className="py-3 flex justify-between items-center text-sm text-emerald-400">
                        <div>
                          <p className="font-semibold">Potongan Diskon</p>
                          <p className="text-xs text-emerald-500/80">
                            {discountType === "percent" ? `${discountValue}%` : "Nominal"}
                          </p>
                        </div>
                        <span className="font-bold">
                          - Rp {(originalSubtotalHarga - subtotalHarga).toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#333] pt-4 flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Subtotal Item</span>
                    <span className="font-semibold text-white">Rp {subtotalHarga.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Kode Unik Konfirmasi</span>
                    <span className="font-bold text-[#FECB2F]">+ Rp {kodeUnik}</span>
                  </div>
                  <div className="border-t border-[#333] pt-3 flex justify-between items-center">
                    <span className="font-extrabold text-white">Total Tagihan</span>
                    <span className="text-2xl font-black text-[#FECB2F]">
                      Rp {totalPay.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Form Lanjutan & Konfirmasi */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-white/5 bg-[#222222] p-7 shadow-2xl space-y-6">
                  <div className="border-b border-[#333] pb-4">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <span>📝</span> Form Transaksi Lanjutan
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Lengkapi username Roblox pembeli, pilih suplier, dan status transaksi.</p>
                  </div>

                  <form onSubmit={handleProcessOrder} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Username Roblox <span className="text-zinc-500 font-normal">(Opsional)</span>
                        </label>
                        {verifiedRoblox && (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Terverifikasi API
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={usernameRoblox}
                            onChange={(e) => {
                              setUsernameRoblox(e.target.value);
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
                            placeholder="Contoh: player_roblox123"
                            className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleCheckRoblox}
                          disabled={checkingRoblox || !usernameRoblox.trim()}
                          className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#FECB2F] to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0"
                        >
                          {checkingRoblox ? (
                            <>
                              <span className="inline-block animate-spin">⏳</span>
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

                      {/* Verified User Preview Card */}
                      {verifiedRoblox && (
                        <div className="mt-2.5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                              {verifiedRoblox.avatarUrl ? (
                                <img
                                  src={verifiedRoblox.avatarUrl}
                                  alt={verifiedRoblox.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg">👤</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">
                                  {verifiedRoblox.displayName}
                                </span>
                                <span className="text-xs text-zinc-400">
                                  (@{verifiedRoblox.name})
                                </span>
                              </div>
                              <div className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1.5 mt-0.5">
                                <span>ID: {verifiedRoblox.id}</span>
                                <span>•</span>
                                <a
                                  href={`https://www.roblox.com/users/${verifiedRoblox.id}/profile`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-emerald-300 transition"
                                >
                                  Buka Profil ↗
                                </a>
                              </div>
                            </div>
                          </div>

                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            ✓ Valid
                          </span>
                        </div>
                      )}
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
                        <label className="text-xs font-semibold text-zinc-400">Supplier Rate</label>
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

                    {/* Sequential Unique Code input */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Sequential Unique Code (1 - 99)
                        </label>
                        <button
                          type="button"
                          onClick={handleRefreshKode}
                          disabled={loadingKodeUnik}
                          className="text-xs text-[#FECB2F] hover:underline font-bold"
                        >
                          {loadingKodeUnik ? "Loading..." : "🔄 Cek Urutan Terkini"}
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

                    <div className="border-t border-[#333] pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting || loadingKodeUnik}
                        className="w-full rounded-xl bg-[#FECB2F] py-3.5 px-6 text-sm font-bold text-[#222222] shadow-[0_0_20px_-5px_#FECB2F] transition-all hover:bg-[#e5b62a] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="inline-block animate-spin">⏳</span>
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <span>Simpan Transaksi (Rp {totalPay.toLocaleString("id-ID")})</span>
                        )}
                      </button>
                    </div>
                  </form>
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
