"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

interface GameItem {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface UserProfile {
  username?: string;
  userLevel?: string;
  robloxUsername?: string;
  robloxAvatarUrl?: string;
}

interface GameStoreClientProps {
  games: GameItem[];
  currentUser: UserProfile | null;
}

export default function GameStoreClient({
  games,
  currentUser,
}: GameStoreClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackInvoice, setTrackInvoice] = useState("");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Kategori filter game
  const categories = [
    { id: "all", label: "Semua Game", icon: "fa-gamepad" },
    { id: "roblox", label: "Roblox & CDID", icon: "fa-cube" },
    { id: "mobile", label: "Mobile Games", icon: "fa-mobile-screen" },
  ];

  // Filter daftar game berdasarkan pencarian dan kategori
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchSearch =
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.slug.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (selectedCategory === "all") return true;
      if (selectedCategory === "roblox") {
        const slug = game.slug.toLowerCase();
        const name = game.name.toLowerCase();
        return (
          slug.includes("roblox") ||
          slug.includes("cdid") ||
          slug.includes("dds") ||
          name.includes("roblox") ||
          name.includes("cdid") ||
          name.includes("dds")
        );
      }
      return true;
    });
  }, [games, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex justify-center selection:bg-[#FECB2F]/30 selection:text-[#FECB2F]">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex justify-center">
        <div className="w-[500px] h-[350px] bg-[#FECB2F]/5 rounded-full blur-[140px] -top-20"></div>
      </div>

      {/* Main Container - Mobile First Max Width MD */}
      <div className="w-full max-w-md min-h-screen bg-[#0f0f12] border-x border-zinc-800/80 shadow-2xl relative flex flex-col pb-8 z-10">
        
        {/* TOP HEADER */}
        <header className="sticky top-0 z-40 bg-[#0f0f12]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-[#FECB2F] flex items-center justify-center shadow-md shadow-amber-500/20 border border-yellow-300/40">
              <i className="fa-solid fa-crown text-zinc-950 text-sm"></i>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-base tracking-tight text-white">YOK</span>
                <span className="font-extrabold text-base tracking-tight text-[#FECB2F]">ENTERTAIMENT</span>
              </div>
            </div>
          </div>

          {/* User Profile / Login Button */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <Link
                href="/owner/dashboard"
                prefetch={true}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 hover:border-[#FECB2F] transition-all group active:scale-95 shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-black border border-[#FECB2F]/50 overflow-hidden flex items-center justify-center shrink-0">
                  {currentUser.robloxAvatarUrl ? (
                    <img src={currentUser.robloxAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <i className="fa-solid fa-cube text-[10px] text-[#FECB2F]"></i>
                  )}
                </div>
                <span className="text-xs font-bold text-white group-hover:text-[#FECB2F] transition-colors truncate max-w-[90px]">
                  {currentUser.username || "Owner"}
                </span>
                <i className="fa-solid fa-chevron-right text-[10px] text-zinc-400 group-hover:text-[#FECB2F]"></i>
              </Link>
            ) : (
              <Link
                href="/login"
                prefetch={true}
                className="px-3.5 py-1.5 rounded-xl bg-[#FECB2F] hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10 active:scale-95 transition-all"
              >
                <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </header>

        {/* ANNOUNCEMENT / INFO BAR DENGAN ICON MEGAPHONE */}
        <div className="bg-gradient-to-r from-zinc-900 via-amber-950/20 to-zinc-900 border-b border-zinc-800/80 px-3 py-1.5 flex items-center gap-2 text-[11px] text-zinc-300 overflow-hidden relative">
          <div className="flex items-center gap-1.5 text-[#FECB2F] font-bold shrink-0 bg-zinc-850 px-2 py-0.5 rounded-md border border-zinc-700/60 z-10 text-[10px]">
            <i className="fa-solid fa-bullhorn text-[#FECB2F]"></i>
            <span>INFO</span>
          </div>
          <div className="overflow-hidden w-full relative flex-1">
            <div className="animate-marquee flex items-center gap-8 text-zinc-300 text-[11px] font-medium">
              <span>Selamat datang di YokEntertaiment • Layanan Top Up CDID, DDS &amp; Roblox Terpercaya</span>
              <span>💳 Pembayaran Lengkap: QRIS, DANA, OVO, ShopeePay &amp; Transfer Bank</span>
              <span>⚠️ Pastikan periksa kembali ID / Username Roblox sebelum checkout</span>
              <span>Selamat datang di YokEntertaiment • Layanan Top Up CDID, DDS &amp; Roblox Terpercaya</span>
              <span>💳 Pembayaran Lengkap: QRIS, DANA, OVO, ShopeePay &amp; Transfer Bank</span>
              <span>⚠️ Pastikan periksa kembali ID / Username Roblox sebelum checkout</span>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-col gap-4 p-4">

          {/* HERO BANNER */}
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950 p-4 shadow-lg flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FECB2F]/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col gap-1 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-amber-400/10 text-[#FECB2F] border border-amber-400/20 w-fit">
                <i className="fa-solid fa-gamepad text-[9px]"></i>
                YokEntertaiment Store
              </span>
              <h1 className="text-lg font-black text-white leading-tight mt-0.5">
                Top Up Game &amp; Reseller
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pilih game favoritmu, tentukan nominal produk, dan bayar dengan metode pembayaran yang tersedia.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 relative z-10">
              <a
                href="#games-section"
                className="flex-1 py-2 rounded-xl bg-[#FECB2F] text-zinc-950 font-bold text-xs text-center hover:bg-amber-400 transition-colors shadow-sm"
              >
                Pilih Game
              </a>
              <button
                onClick={() => setShowTrackModal(true)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-750 text-white font-bold text-xs text-center transition-colors"
              >
                Lacak Pesanan
              </button>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <div
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border transition-all ${
                isSearchFocused
                  ? "border-[#FECB2F] ring-1 ring-[#FECB2F]/20"
                  : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <i className={`fa-solid fa-magnifying-glass text-xs ${isSearchFocused ? "text-[#FECB2F]" : "text-zinc-500"}`}></i>
              <input
                type="text"
                placeholder="Cari game (CDID, DDS, Roblox...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white text-[10px]"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>

          {/* CATEGORIES FILTER */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                    isActive
                      ? "bg-[#FECB2F] text-zinc-950 font-bold shadow-sm"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  }`}
                >
                  <i className={`fa-solid ${cat.icon} text-[11px]`}></i>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* DAFTAR GAME */}
          <div id="games-section" className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <i className="fa-solid fa-layer-group text-[#FECB2F] text-xs"></i>
                Daftar Game
              </h2>
              <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                {filteredGames.length} Game
              </span>
            </div>

            {filteredGames.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredGames.map((game) => {
                  const isCdid = game.slug.toLowerCase().includes("cdid") || game.name.toLowerCase().includes("cdid");
                  const isDds = game.slug.toLowerCase().includes("dds") || game.name.toLowerCase().includes("dds");
                  
                  return (
                    <Link
                      href={`/reseller/order/${game.slug}`}
                      prefetch={true}
                      key={game.id}
                      className="group flex flex-col rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-[#FECB2F]/60 transition-all p-3 relative overflow-hidden active:scale-[0.98] shadow-sm"
                    >
                      {/* Game Cover / Icon */}
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative border border-zinc-800 mb-2.5 bg-zinc-950 flex items-center justify-center">
                        {/* Fallback Graphic */}
                        <div
                          className={`absolute inset-0 flex flex-col items-center justify-center p-2 bg-gradient-to-br ${
                            isCdid
                              ? "from-blue-800 to-zinc-950"
                              : isDds
                              ? "from-amber-700 to-zinc-950"
                              : "from-zinc-800 to-zinc-950"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white mb-1 shadow-sm">
                            {isCdid ? (
                              <i className="fa-solid fa-car-side text-base text-blue-300"></i>
                            ) : isDds ? (
                              <i className="fa-solid fa-gauge-high text-base text-amber-300"></i>
                            ) : (
                              <i className="fa-solid fa-cube text-base text-[#FECB2F]"></i>
                            )}
                          </div>
                          <span className="text-[11px] font-extrabold text-white text-center line-clamp-1">
                            {game.name}
                          </span>
                        </div>

                        {/* Image overlay with onError fallback */}
                        {!failedImages[`grid-${game.id}`] && game.image_url && (
                          <img
                            src={game.image_url}
                            alt={game.name}
                            onError={() => {
                              setFailedImages((prev) => ({ ...prev, [`grid-${game.id}`]: true }));
                            }}
                            className="w-full h-full object-cover relative z-10 group-hover:scale-105 transition-transform duration-200"
                          />
                        )}
                      </div>

                      {/* Title & Info */}
                      <div className="flex flex-col flex-1 justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-white group-hover:text-[#FECB2F] transition-colors line-clamp-1">
                            {game.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            Produk Resmi
                          </span>
                        </div>

                        <div className="w-full py-1.5 rounded-lg bg-zinc-800 group-hover:bg-[#FECB2F] text-zinc-300 group-hover:text-zinc-950 font-bold text-[11px] text-center transition-colors flex items-center justify-center gap-1">
                          <span>Top Up</span>
                          <i className="fa-solid fa-chevron-right text-[9px]"></i>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
                <i className="fa-solid fa-gamepad text-2xl text-zinc-600 mb-2"></i>
                <h4 className="text-xs font-bold text-zinc-300">Game tidak ditemukan</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Coba cari dengan kata kunci lain.</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 px-3 py-1 rounded-lg bg-[#FECB2F] text-zinc-950 text-xs font-bold"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* PANDUAN CARA ORDER (3 LANGKAH) */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 flex flex-col gap-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-400/10 text-[#FECB2F] flex items-center justify-center text-xs">
                <i className="fa-solid fa-circle-question"></i>
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Cara Order Mudah
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-750/60">
                <span className="text-[10px] font-extrabold text-[#FECB2F]">01</span>
                <span className="text-[11px] font-bold text-zinc-200">Pilih Game</span>
                <span className="text-[9px] text-zinc-400 leading-relaxed">Tentukan game &amp; item yang ingin dibeli.</span>
              </div>
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-750/60">
                <span className="text-[10px] font-extrabold text-[#FECB2F]">02</span>
                <span className="text-[11px] font-bold text-zinc-200">Data Akun</span>
                <span className="text-[9px] text-zinc-400 leading-relaxed">Masukkan Username / User ID kamu.</span>
              </div>
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-750/60">
                <span className="text-[10px] font-extrabold text-[#FECB2F]">03</span>
                <span className="text-[11px] font-bold text-zinc-200">Bayar</span>
                <span className="text-[9px] text-zinc-400 leading-relaxed">Bayar via QRIS/Bank &amp; pesanan diproses.</span>
              </div>
            </div>
          </div>

          {/* PROGRAM RESELLER VIP CARD */}
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 p-3.5 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FECB2F]/15 text-[#FECB2F] border border-[#FECB2F]/30 flex items-center justify-center text-sm shrink-0">
                <i className="fa-solid fa-crown"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Ingin Harga Lebih Murah?</span>
                <span className="text-[10px] text-zinc-400">Upgrade ke VIP untuk dapat akses harga modal reseller.</span>
              </div>
            </div>
            <Link
              href="/reseller/vip/plan"
              className="px-3 py-1.5 rounded-xl bg-[#FECB2F] hover:bg-amber-400 text-zinc-950 font-bold text-xs whitespace-nowrap shrink-0 transition-colors shadow-sm"
            >
              Lihat VIP
            </Link>
          </div>

        </div>

        {/* MODAL LACAK PESANAN */}
        {showTrackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#141418] border border-zinc-800 p-4 shadow-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-[#FECB2F] flex items-center justify-center text-xs">
                    <i className="fa-solid fa-receipt"></i>
                  </div>
                  <h3 className="font-bold text-xs text-white">Lacak Status Pesanan</h3>
                </div>
                <button
                  onClick={() => setShowTrackModal(false)}
                  className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <p className="text-[11px] text-zinc-400">
                Masukkan nomor invoice transaksi kamu untuk mengecek status pesanan:
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Nomor Invoice</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 focus-within:border-[#FECB2F]">
                  <i className="fa-solid fa-hashtag text-[10px] text-zinc-500"></i>
                  <input
                    type="text"
                    placeholder="Contoh: INV-..."
                    value={trackInvoice}
                    onChange={(e) => setTrackInvoice(e.target.value)}
                    className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (trackInvoice.trim()) {
                    window.location.href = `/reseller/payment/${encodeURIComponent(trackInvoice.trim())}`;
                  }
                }}
                disabled={!trackInvoice.trim()}
                className="w-full py-2 rounded-xl bg-[#FECB2F] disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all mt-1"
              >
                <i className="fa-solid fa-magnifying-glass text-xs"></i>
                <span>Cek Status</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
