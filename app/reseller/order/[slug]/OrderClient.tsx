"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function OrderClient({ game, products }: { game: any, products: any[] }) {
  // Cart state: mapping product ID to quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [userId, setUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(prod => 
    prod.nama_produk.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        const price = Number(prod.harga_reseller || prod.harga_jual) || 0;
        total += price * cart[prodId];
      }
    }
    return total;
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const handleCheckout = () => {
    if (!userId.trim()) {
      toast.error("Silakan isi User ID / Username terlebih dahulu.");
      return;
    }
    // TODO: Connect to actual checkout API
    toast.success("Checkout berhasil diproses! (Mock)");
    setShowCheckout(false);
    setCart({});
    setUserId("");
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
              
              return (
                <div key={prod.id} 
                  className={`bg-white dark:bg-[#1a1a1a] border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isSelected ? 'border-[#FECB2F]' : 'border-gray-100 dark:border-gray-800 hover:border-[#FECB2F]/50'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-2 pr-4">{prod.nama_produk}</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">VIP Member Price</div>
                    <div className="font-extrabold text-[#FECB2F] text-lg mb-3">
                      Rp {Number(prod.harga_reseller || prod.harga_jual).toLocaleString('id-ID')}
                    </div>
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

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Selesaikan Order</h3>
              <button onClick={() => setShowCheckout(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="mb-6 bg-gray-50 dark:bg-[#222] p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Total Item</span>
                <span className="font-bold text-gray-900 dark:text-white">{totalItems}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Harga</span>
                <span className="font-bold text-[#FECB2F] text-lg">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                User ID / Username Game <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Contoh: player_123"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121212] px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] outline-none transition"
              />
              <p className="text-xs text-gray-500 mt-2">
                Pastikan ID/Username yang dimasukkan sudah benar.
              </p>
            </div>

            <button 
              onClick={handleCheckout}
              className="w-full bg-[#FECB2F] hover:bg-[#e5b62a] text-[#222] py-3.5 rounded-xl font-bold shadow-lg transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-check"></i> Konfirmasi Pesanan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
