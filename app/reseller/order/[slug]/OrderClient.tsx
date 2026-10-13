"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { lookupRobloxUser, createResellerOrder } from "@/app/reseller/order/actions";

interface OrderClientProps {
  game: any;
  products: any[];
  isVip?: boolean;
  vipPlanName?: string;
}

export default function OrderClient({ game, products, isVip = false, vipPlanName = "" }: OrderClientProps) {
  const router = useRouter();

  // Cart state: mapping product ID to quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [userId, setUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Roblox API validation state
  const [isCheckingRoblox, setIsCheckingRoblox] = useState(false);
  const [robloxUser, setRobloxUser] = useState<{
    id: number;
    name: string;
    displayName: string;
    avatarUrl?: string;
  } | null>(null);
  const [robloxError, setRobloxError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products.filter(prod => 
    prod.nama_produk.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Perhitungan harga berdasarkan status keanggotaan:
  // - Belum VIP (Member Reguler): menggunakan harga_jual (misal Rp 2.000)
  // - Sudah VIP: menggunakan harga_reseller (misal Rp 1.080)
  const getItemPrice = (prod: any) => {
    if (isVip) {
      return Number(prod.harga_reseller) > 0 
        ? Number(prod.harga_reseller) 
        : (Number(prod.harga_jual) || 0);
    }
    return Number(prod.harga_jual) || 0;
  };

  const updateQuantity = (prodId: string, delta: number) => {
    setCart(prev => {
      const current = prev[prodId] || 0;
      const next = Math.max(0, current + delta);
      const newCart = { ...prev };
      if (next === 0) {
        delete newCart[prodId];
      } else {
        newCart[prodId] = next;
      }
      return newCart;
    });
  };

  const getCartTotal = () => {
    let total = 0;
    for (const prodId in cart) {
      const prod = products.find(p => p.id === prodId);
      if (prod) {
        total += getItemPrice(prod) * cart[prodId];
      }
    }
    return total;
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const handleCheckRoblox = async () => {
    if (!userId.trim()) {
      setRobloxError("Silakan isi User ID / Username Roblox terlebih dahulu.");
      return;
    }
    setIsCheckingRoblox(true);
    setRobloxError("");
    try {
      const res = await lookupRobloxUser(userId);
      if (res.success && res.user) {
        setRobloxUser(res.user);
        setRobloxError("");
        toast.success(`Akun Roblox @${res.user.name} berhasil ditemukan!`);
      } else {
        setRobloxUser(null);
        setRobloxError(res.error || "Akun Roblox tidak ditemukan.");
      }
    } catch (err: any) {
      setRobloxError("Gagal memeriksa akun Roblox.");
    } finally {
      setIsCheckingRoblox(false);
    }
  };

  const handleCheckout = async () => {
    if (!userId.trim()) {
      toast.error("Silakan isi User ID / Username Roblox terlebih dahulu.");
      return;
    }

    let verifiedUser = robloxUser;
    // Jika belum dicek atau query berubah, cek otomatis ke API Roblox
    if (!verifiedUser || (verifiedUser.name.toLowerCase() !== userId.trim().toLowerCase() && String(verifiedUser.id) !== userId.trim())) {
      setIsCheckingRoblox(true);
      setRobloxError("");
      const res = await lookupRobloxUser(userId);
      setIsCheckingRoblox(false);

      if (!res.success || !res.user) {
        setRobloxError(res.error || "Akun Roblox tidak ditemukan. Periksa kembali username atau ID Anda.");
        toast.error(res.error || "Akun Roblox tidak valid.");
        return;
      }

      verifiedUser = res.user;
      setRobloxUser(res.user);
    }

    const items = Object.entries(cart).map(([prodId, qty]) => {
      const prod = products.find(p => p.id === prodId);
      return {
        id_produk: prodId,
        qty,
        price: getItemPrice(prod),
      };
    });

    if (items.length === 0) {
      toast.error("Keranjang belanja kosong.");
      return;
    }

    const orderRobloxName = verifiedUser.name;

    setIsSubmitting(true);
    try {
      // 1. Simpan pesanan ke database model transaksi_reseller
      const orderRes = await createResellerOrder({
        id_game: game.id,
        username_roblox: orderRobloxName,
        items,
      });

      if (!orderRes.success || !orderRes.invoices || orderRes.invoices.length === 0) {
        toast.error(orderRes.error || "Gagal membuat transaksi.");
        return;
      }

      toast.success("Pesanan berhasil dibuat! Mengalihkan ke halaman pembayaran...");
      
      // Reset keranjang & form
      setShowCheckout(false);
      setCart({});
      setUserId("");
      setRobloxUser(null);

      // 2. Redirect ke halaman baru pembayaran
      const primaryInv = orderRes.invoices[0];
      router.push(`/reseller/order/payment/${primaryInv}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat memproses pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = getCartTotal();
  const totalItems = getTotalItems();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#121212] animate-fade-in pb-24">
      {/* Header */}
      <div className="fixed top-0 w-full max-w-md bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md z-30 px-4 py-4 shadow-sm flex items-center gap-3">
        <Link href="/reseller/dashboard" className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
          <i className="fa-solid fa-arrow-left text-lg"></i>
        </Link>
        <div className="flex items-center gap-3">
          {game.image_url ? (
            <img src={game.image_url} alt={game.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              <i className="fa-solid fa-gamepad text-gray-500 text-xs"></i>
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{game.name}</h1>
        </div>
      </div>

      {/* Product List */}
      <div className="px-4 pt-24 pb-6">
        {/* Banner Upgrade VIP (Hanya ditampilkan jika belum VIP) */}
        {!isVip && (
          <div className="mb-3">
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400">
                  <i className="fa-solid fa-user text-xs"></i>
                </div>
                <p className="text-xs text-gray-600 dark:text-zinc-300">
                  Upgrade ke VIP untuk harga grosir termurah
                </p>
              </div>
              <Link href="/reseller/vip/plan" className="text-xs font-semibold text-[#FECB2F] hover:underline flex items-center gap-1 shrink-0">
                Beli VIP <i className="fa-solid fa-chevron-right text-[9px]"></i>
              </Link>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
              <i className="fa-solid fa-magnifying-glass text-sm"></i>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk / nominal..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] pl-10 pr-9 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            )}
          </div>
        </div>

        <h2 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Pilih Produk / Nominal</h2>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-gray-800">
            <i className="fa-solid fa-box-open text-3xl text-gray-300 dark:text-gray-600 mb-2"></i>
            <p className="text-gray-500 text-sm">
              {searchQuery ? `Tidak ada produk yang cocok dengan "${searchQuery}".` : "Belum ada produk untuk game ini."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((prod: any) => {
              const qty = cart[prod.id] || 0;
              const isSelected = qty > 0;
              const currentPrice = getItemPrice(prod);

              const regularPrice = Number(prod.harga_jual) || 0;
              const vipPrice = Number(prod.harga_reseller) > 0 ? Number(prod.harga_reseller) : regularPrice;

              return (
                <div key={prod.id} 
                  className={`bg-white dark:bg-[#1a1a1a] border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isSelected ? 'border-[#FECB2F]' : 'border-gray-100 dark:border-gray-800 hover:border-[#FECB2F]/50'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-2 pr-2">{prod.nama_produk}</h3>
                    
                    {isVip ? (
                      <div>
                        <div className="text-[11px] text-[#FECB2F] font-semibold mb-1 flex items-center gap-1">
                          <i className="fa-solid fa-crown text-[9px]"></i>
                          <span>Harga {vipPlanName || "VIP"}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="font-extrabold text-[#FECB2F] text-lg">
                            Rp {currentPrice.toLocaleString('id-ID')}
                          </span>
                          {regularPrice > currentPrice && (
                            <span className="text-xs text-zinc-500 line-through">
                              Rp {regularPrice.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-extrabold text-gray-900 dark:text-white text-lg mb-1">
                          Rp {currentPrice.toLocaleString('id-ID')}
                        </div>
                        {vipPrice < currentPrice ? (
                          <div className="text-[10px] text-amber-500 dark:text-[#FECB2F] font-medium mb-3 flex items-center gap-1">
                            <i className="fa-solid fa-crown text-[8px]"></i>
                            VIP: Rp {vipPrice.toLocaleString('id-ID')}
                          </div>
                        ) : (
                          <div className="mb-3"></div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Cart Controls */}
                  <div className="mt-auto">
                    {qty === 0 ? (
                      <button 
                        onClick={() => updateQuantity(prod.id, 1)}
                        className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-[#FECB2F] hover:text-[#222] dark:hover:bg-[#FECB2F] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors"
                      >
                        <i className="fa-solid fa-plus mr-1"></i> Tambah
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-[#FECB2F]/10 rounded-xl p-1 border border-[#FECB2F]/30">
                        <button 
                          onClick={() => updateQuantity(prod.id, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-[#222] text-[#FECB2F] shadow-sm hover:bg-gray-50"
                        >
                          <i className="fa-solid fa-minus text-xs"></i>
                        </button>
                        <span className="font-bold text-gray-900 dark:text-white">{qty}</span>
                        <button 
                          onClick={() => updateQuantity(prod.id, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FECB2F] text-[#222] shadow-sm hover:bg-[#e5b62a]"
                        >
                          <i className="fa-solid fa-plus text-xs"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-40 transform transition-transform translate-y-0">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{totalItems} Item terpilih</div>
              <div className="font-extrabold text-xl text-gray-900 dark:text-white">
                Rp {total.toLocaleString('id-ID')}
              </div>
            </div>
            <button 
              onClick={() => setShowCheckout(true)}
              className="bg-[#FECB2F] hover:bg-[#e5b62a] text-[#222] px-6 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Checkout <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal - Hanya Form Pembuatan Pesanan */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-fade-in-up border border-gray-100 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Selesaikan Order</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Verifikasi akun tujuan Roblox Anda</p>
              </div>
              <button 
                onClick={() => setShowCheckout(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            {/* Rincian Total Pesanan */}
            <div className="mb-5 bg-gray-50 dark:bg-[#222] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Item</span>
                <span className="font-bold text-gray-900 dark:text-white">{totalItems}x Item</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 dark:border-zinc-700/60">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">Total Tagihan</span>
                <span className="font-black text-[#FECB2F] text-xl">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                User ID / Username Roblox <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    if (robloxUser) setRobloxUser(null);
                    if (robloxError) setRobloxError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCheckRoblox();
                    }
                  }}
                  placeholder="Contoh: Roblox atau 1"
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] outline-none transition text-sm"
                />
                <button
                  type="button"
                  onClick={handleCheckRoblox}
                  disabled={isCheckingRoblox || !userId.trim()}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {isCheckingRoblox ? (
                    <i className="fa-solid fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fa-solid fa-magnifying-glass"></i>
                  )}
                  <span>Cek</span>
                </button>
              </div>

              {/* Status & Preview Akun Roblox */}
              {isCheckingRoblox && (
                <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
                  <i className="fa-solid fa-spinner fa-spin text-[#FECB2F]"></i>
                  Memeriksa akun Roblox via API...
                </p>
              )}

              {robloxError && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                  <span>{robloxError}</span>
                </div>
              )}

              {robloxUser && (
                <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-3">
                    {robloxUser.avatarUrl ? (
                      <img 
                        src={robloxUser.avatarUrl} 
                        alt={robloxUser.name} 
                        className="w-11 h-11 rounded-full border-2 border-emerald-500/40 bg-[#121212]"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <i className="fa-solid fa-user"></i>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                          {robloxUser.displayName}
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">
                          ✓ Valid
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        @{robloxUser.name} &bull; ID: {robloxUser.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!robloxUser && !robloxError && !isCheckingRoblox && (
                <p className="text-xs text-gray-500 mt-2">
                  Masukkan Username Roblox, lalu klik "Cek" untuk memverifikasi akun tujuan.
                </p>
              )}
            </div>

            <button 
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full bg-[#FECB2F] hover:bg-[#e5b62a] text-[#222] py-3.5 rounded-xl font-bold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Membuat Pesanan...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>Buat Pesanan & Bayar (Rp {total.toLocaleString('id-ID')})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Selesai Checkout Modal */}
    </div>
  );
}
