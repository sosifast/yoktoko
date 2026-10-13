"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  recentOrders?: Array<{
    game_name: string;
    product_name?: string;
    price: number | string;
    time_ago: string;
  }>;
}

export default function GameStoreClient({
  games,
  currentUser,
  recentOrders = [],
}: GameStoreClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackInvoice, setTrackInvoice] = useState("");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Promo Banners
  const promoBanners = [
    {
      id: 1,
      tag: "⚡ FLASH SALE TERBATAS",
      title: "Top Up Game Murah",
      description: "Nikmati harga spesial reseller & otomatis masuk akun dalam 1-3 menit!",
      badge: "Diskon s/d 40%",
      bgGradient: "from-amber-600/30 via-yellow-500/10 to-transparent",
      borderColor: "border-[#FECB2F]/40",
      ctaText: "Top Up Sekarang",
      ctaLink: "#games-section",
      accentIcon: "fa-bolt",
    },
    {
      id: 2,
      tag: "👑 PROGRAM KHUSUS",
      title: "Gabung Menjadi Reseller VIP",
      description: "Dapatkan akses harga modal termurah & keuntungan berlipat ganda setiap hari.",
      badge: "Margin Tinggi",
      bgGradient: "from-yellow-700/30 via-amber-900/10 to-transparent",
      borderColor: "border-amber-400/50",
      ctaText: "Upgrade VIP",
      ctaLink: "/reseller/vip/plan",
      accentIcon: "fa-crown",
    },
    {
      id: 3,
      tag: "🛡️ GARANSI RESMI",
      title: "100% Legal, Aman & Terpercaya",
      description: "Semua item dan koin diproses resmi dengan sistem keamanan terverifikasi.",
      badge: "Garansi Uang Kembali",
      bgGradient: "from-emerald-600/25 via-teal-900/10 to-transparent",
      borderColor: "border-emerald-500/40",
      ctaText: "Lihat Layanan",
      ctaLink: "#features-section",
      accentIcon: "fa-shield-halved",
    },
  ];

  // Auto carousel slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [promoBanners.length]);

  // Categories list
  const categories = [
    { id: "all", label: "Semua Game", icon: "fa-gamepad" },
    { id: "roblox", label: "Roblox & CDID", icon: "fa-cube" },
    { id: "popular", label: "Paling Populer", icon: "fa-fire" },
    { id: "mobile", label: "Mobile Games", icon: "fa-mobile-screen" },
  ];

  // Filtered games logic
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchSearch =
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.slug.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (selectedCategory === "all") return true;
      if (selectedCategory === "roblox") {
        const slug = game.slug.toLowerCase();
        return (
          slug.includes("roblox") ||
          slug.includes("cdid") ||
          slug.includes("dds") ||
          game.name.toLowerCase().includes("roblox") ||
          game.name.toLowerCase().includes("cdid") ||
          game.name.toLowerCase().includes("dds")
        );
      }
      if (selectedCategory === "popular") {
        return true; // highlight all available games
      }
      return true;
    });
  }, [games, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex justify-center selection:bg-[#FECB2F]/30 selection:text-[#FECB2F]">
      {/* Background ambient lighting for desktop viewport */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex justify-center">
        <div className="w-[600px] h-[400px] bg-[#FECB2F]/5 rounded-full blur-[140px] -top-24"></div>
        <div className="w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[160px] top-[40%]"></div>
      </div>

      {/* Mobile container - Max Width MD Centered */}
      <div className="w-full max-w-md min-h-screen bg-[#0f0f12] border-x border-zinc-800/70 shadow-2xl relative flex flex-col pb-28 z-10">
        
        {/* TOP APP BAR / BRAND HEADER */}
        <header className="sticky top-0 z-40 bg-[#0f0f12]/90 backdrop-blur-xl border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-[#FECB2F] to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-yellow-300/40">
              <i className="fa-solid fa-crown text-zinc-950 text-base"></i>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">YOK</span>
                <span className="font-extrabold text-base tracking-tight text-[#FECB2F]">ENTERTAIMENT</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium -mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Toko Game 24 Jam</span>
              </div>
            </div>
          </div>

          {/* User Profile or Login CTA */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <Link
                href={currentUser.userLevel === "owner" ? "/owner/dashboard" : "/reseller/dashboard"}
                className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-zinc-900/95 border border-zinc-750 hover:border-[#FECB2F]/60 transition-all group active:scale-95 shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-black border border-[#FECB2F]/50 overflow-hidden flex items-center justify-center shrink-0">
                  {currentUser.robloxAvatarUrl ? (
                    <img src={currentUser.robloxAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <i className="fa-solid fa-cube text-[11px] text-[#FECB2F]"></i>
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-zinc-400 font-semibold leading-tight">Akun</span>
                  <span className="text-xs font-bold text-white group-hover:text-[#FECB2F] transition-colors truncate max-w-[95px] leading-tight">
                    {currentUser.username || "Reseller"}
                  </span>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] text-zinc-400 group-hover:text-[#FECB2F] ml-0.5"></i>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#FECB2F] hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </header>

        {/* RUNNING MARQUEE ANNOUNCEMENT */}
        <div className="bg-gradient-to-r from-zinc-900 via-amber-950/20 to-zinc-900 border-b border-zinc-800/60 px-3 py-1.5 flex items-center gap-2.5 text-[11px] text-zinc-300 overflow-hidden relative">
          <div className="flex items-center gap-1 text-[#FECB2F] font-black shrink-0 bg-zinc-800/90 px-2 py-0.5 rounded-md shadow-sm border border-zinc-700/60 z-10">
            <i className="fa-solid fa-bullhorn text-[10px] animate-bounce text-amber-400"></i>
            <span>INFO</span>
          </div>
          <div className="overflow-hidden w-full relative flex-1">
            <div className="animate-marquee flex items-center gap-8 text-zinc-300 text-[11px] font-medium">
              <span>⚡ Layanan Otomatis 24 Jam Nonstop • Top Up CDID, DDS &amp; Robux Proses Instan 1 Detik!</span>
              <span>💳 Pembayaran Lengkap: QRIS, DANA, ShopeePay, OVO, &amp; Virtual Account Bank</span>
              <span>🛡️ 100% Legal &amp; Bergaransi Resmi YokEntertaiment</span>
            </div>
          </div>
        </div>

        {/* MAIN BODY CONTENT */}
        <div className="flex flex-col gap-5 p-4">

          {/* PROMO HERO CAROUSEL */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/60 shadow-xl">
            <div className="relative min-h-[160px] p-4 flex flex-col justify-between overflow-hidden">
              {/* Active slide background glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${promoBanners[currentSlide].bgGradient} transition-opacity duration-700 pointer-events-none`}
              ></div>

              {/* Decorative Corner Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FECB2F]/15 rounded-full blur-2xl pointer-events-none"></div>

              {/* Slide Content */}
              <div className="relative z-10 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#FECB2F]/20 text-[#FECB2F] border border-[#FECB2F]/40">
                    <i className={`fa-solid ${promoBanners[currentSlide].accentIcon} text-[9px]`}></i>
                    {promoBanners[currentSlide].tag}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md">
                    {currentSlide + 1} / {promoBanners.length}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-black text-white leading-tight mt-1">
                  {promoBanners[currentSlide].title}
                </h2>
                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                  {promoBanners[currentSlide].description}
                </p>
              </div>

              {/* CTA and Dots */}
              <div className="relative z-10 flex items-center justify-between pt-3 mt-1 border-t border-zinc-800/60">
                <a
                  href={promoBanners[currentSlide].ctaLink}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FECB2F] hover:text-amber-300 transition-colors group"
                >
                  <span>{promoBanners[currentSlide].ctaText}</span>
                  <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                </a>

                {/* Dot pagination */}
                <div className="flex items-center gap-1.5">
                  {promoBanners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentSlide ? "w-6 bg-[#FECB2F]" : "w-1.5 bg-zinc-700 hover:bg-zinc-600"
                      }`}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <div
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border transition-all ${
                isSearchFocused
                  ? "border-[#FECB2F] ring-2 ring-[#FECB2F]/20 shadow-lg shadow-[#FECB2F]/5"
                  : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <i className={`fa-solid fa-magnifying-glass text-sm ${isSearchFocused ? "text-[#FECB2F]" : "text-zinc-500"}`}></i>
              <input
                type="text"
                placeholder="Cari game favoritmu (CDID, DDS...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>

          {/* CATEGORIES PILLS FILTER */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                    isActive
                      ? "bg-[#FECB2F] text-zinc-950 shadow-md shadow-amber-500/20 font-bold"
                      : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <i className={`fa-solid ${cat.icon} text-xs`}></i>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* FLASH HIGHLIGHT / REKOMENDASI TERPOPULER */}
          {selectedCategory === "all" && searchQuery === "" && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-fire text-[#FECB2F]"></i>
                    Game Terlaris Hari Ini
                  </h3>
                </div>
                <span className="text-[11px] text-[#FECB2F] font-semibold">Instant Delivery</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {games.slice(0, 2).map((game) => {
                  const isCdid = game.slug.toLowerCase().includes("cdid") || game.name.toLowerCase().includes("cdid");
                  const isDds = game.slug.toLowerCase().includes("dds") || game.name.toLowerCase().includes("dds");
                  return (
                    <Link
                      href={`/reseller/order/${game.slug}`}
                      key={`popular-${game.id}`}
                      className="group relative rounded-2xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950 p-2.5 border border-zinc-800 hover:border-[#FECB2F]/60 transition-all flex flex-col justify-between overflow-hidden shadow-lg active:scale-[0.98]"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-[#FECB2F]/5 rounded-full blur-xl pointer-events-none group-hover:bg-[#FECB2F]/15 transition-all"></div>
                      
                      <div className="flex items-center gap-2.5">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700/60 shadow-md relative group-hover:scale-105 transition-transform flex items-center justify-center">
                          {/* Fallback Graphic */}
                          <div
                            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${
                              isCdid
                                ? "from-blue-700 to-indigo-900"
                                : isDds
                                ? "from-amber-600 to-red-900"
                                : "from-zinc-800 to-zinc-950"
                            }`}
                          >
                            {isCdid ? (
                              <i className="fa-solid fa-car-side text-blue-300 text-sm"></i>
                            ) : isDds ? (
                              <i className="fa-solid fa-gauge-high text-amber-300 text-sm"></i>
                            ) : (
                              <i className="fa-solid fa-cube text-[#FECB2F] text-sm"></i>
                            )}
                          </div>
                          {!failedImages[`popular-${game.id}`] && game.image_url && (
                            <img
                              src={game.image_url}
                              alt=""
                              onError={() => {
                                setFailedImages((prev) => ({ ...prev, [`popular-${game.id}`]: true }));
                              }}
                              className="w-full h-full object-cover relative z-10"
                            />
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-black text-white group-hover:text-[#FECB2F] transition-colors truncate">
                            {game.name}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                            <i className="fa-solid fa-bolt text-[9px]"></i> Otomatis
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 text-[10px]">Mulai Rp 1.000</span>
                        <span className="text-[#FECB2F] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Order <i className="fa-solid fa-arrow-right text-[9px]"></i>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* MAIN GAMES GRID SECTION */}
          <div id="games-section" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  <i className="fa-solid fa-shapes text-[#FECB2F]"></i>
                  Daftar Game &amp; Produk
                </h3>
                <p className="text-[11px] text-zinc-400">Pilih game untuk melihat pilihan top up &amp; harga</p>
              </div>
              <span className="text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg">
                {filteredGames.length} Game
              </span>
            </div>

            {filteredGames.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredGames.map((game) => {
                  const isCdid = game.slug.toLowerCase().includes("cdid") || game.name.toLowerCase().includes("cdid");
                  const isDds = game.slug.toLowerCase().includes("dds") || game.name.toLowerCase().includes("dds");
                  
                  return (
                    <Link
                      href={`/reseller/order/${game.slug}`}
                      key={game.id}
                      className="group flex flex-col rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800/90 hover:border-[#FECB2F]/70 transition-all p-3 relative overflow-hidden active:scale-95 shadow-lg"
                    >
                      {/* Status Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          INSTAN
                        </span>
                        <span className="text-[10px] text-zinc-500 group-hover:text-[#FECB2F] transition-colors">
                          <i className="fa-solid fa-bolt"></i>
                        </span>
                      </div>

                      {/* Cover Area with Fallback Art */}
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative border border-zinc-700/50 mb-2.5 shadow-inner group-hover:shadow-xl transition-all">
                        {/* Fallback Graphic */}
                        <div
                          className={`absolute inset-0 flex flex-col items-center justify-center p-2 bg-gradient-to-br ${
                            isCdid
                              ? "from-blue-700 via-indigo-900 to-zinc-950"
                              : isDds
                              ? "from-amber-600 via-red-900 to-zinc-950"
                              : "from-zinc-800 via-zinc-900 to-black"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-1 shadow-md group-hover:scale-110 transition-transform">
                            {isCdid ? (
                              <i className="fa-solid fa-car-side text-lg text-blue-300"></i>
                            ) : isDds ? (
                              <i className="fa-solid fa-gauge-high text-lg text-amber-300"></i>
                            ) : (
                              <i className="fa-solid fa-cube text-lg text-[#FECB2F]"></i>
                            )}
                          </div>
                          <span className="text-xs font-black text-white tracking-wider uppercase drop-shadow-md">
                            {game.name}
                          </span>
                        </div>

                        {/* Image overlay with silent onError fallback */}
                        {!failedImages[`grid-${game.id}`] && game.image_url && (
                          <img
                            src={game.image_url}
                            alt=""
                            onError={() => {
                              setFailedImages((prev) => ({ ...prev, [`grid-${game.id}`]: true }));
                            }}
                            className="w-full h-full object-cover relative z-10 group-hover:scale-105 transition-transform duration-300"
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-20 pointer-events-none"></div>
                      </div>

                      {/* Game Title & Details */}
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white group-hover:text-[#FECB2F] transition-colors truncate">
                          {game.name}
                        </span>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-zinc-400 text-[10px]">Mulai Rp 1.000</span>
                          <span className="text-emerald-400 font-semibold text-[10px]">Legal 100%</span>
                        </div>
                      </div>

                      {/* Bottom Button */}
                      <div className="mt-3 w-full py-2 rounded-xl bg-zinc-800 group-hover:bg-[#FECB2F] text-zinc-300 group-hover:text-zinc-950 font-extrabold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-sm">
                        <span>Top Up</span>
                        <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
                  <i className="fa-solid fa-ghost text-xl"></i>
                </div>
                <h4 className="text-sm font-bold text-zinc-300">Game tidak ditemukan</h4>
                <p className="text-xs text-zinc-500 mt-1">Coba cari dengan kata kunci lain seperti CDID atau DDS.</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 px-3 py-1 rounded-lg bg-[#FECB2F] text-zinc-950 text-xs font-bold"
                >
                  Reset Pencarian
                </button>
              </div>
            )}
          </div>

          {/* SOCIAL PROOF: RECENT TRANSACTIONS TICKER */}
          <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-900 border border-zinc-800 p-3.5 shadow-lg flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-circle-check text-emerald-400 text-xs"></i>
                <span className="text-xs font-extrabold text-white">Transaksi Berhasil Terkini</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">Realtime Server</span>
            </div>

            <div className="flex flex-col gap-2">
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 3).map((order, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-750 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 font-bold">
                        <i className="fa-solid fa-bolt"></i>
                      </div>
                      <div className="flex flex-col overflow-hidden text-left">
                        <span className="text-zinc-200 font-bold text-[11px] truncate">{order.game_name}</span>
                        <span className="text-zinc-400 text-[10px] truncate">{order.product_name || "Top Up"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col text-right shrink-0">
                      <span className="text-[#FECB2F] font-bold text-[11px]">
                        Rp {Number(order.price || 0).toLocaleString("id-ID")}
                      </span>
                      <span className="text-zinc-500 text-[9px]">{order.time_ago}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-750 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <span className="text-zinc-200 text-[11px] font-semibold">User ***82 baru saja top up CDID</span>
                  </div>
                  <span className="text-zinc-500 text-[10px]">Baru saja</span>
                </div>
              )}
            </div>
          </div>

          {/* VALUE PROPOSITIONS / KENAPA HARUS YOKENTERTAIMENT */}
          <div id="features-section" className="flex flex-col gap-2.5">
            <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider">
              Kenapa Memilih YokEntertaiment?
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col gap-1.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-[#FECB2F] flex items-center justify-center text-sm border border-amber-400/20">
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <h4 className="text-xs font-bold text-white">Pengiriman Instan</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Pesanan diproses langsung oleh sistem otomatis dalam 1-3 menit.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col gap-1.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center text-sm border border-emerald-400/20">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <h4 className="text-xs font-bold text-white">100% Legal & Aman</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Semua transaksi resmi bergaransi tanpa takut risiko banned akun.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col gap-1.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center text-sm border border-blue-400/20">
                  <i className="fa-solid fa-wallet"></i>
                </div>
                <h4 className="text-xs font-bold text-white">Metode Lengkap</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  QRIS semua e-wallet (DANA, ShopeePay, OVO) & Virtual Account Bank.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col gap-1.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-rose-400/10 text-rose-400 flex items-center justify-center text-sm border border-rose-400/20">
                  <i className="fa-solid fa-headset"></i>
                </div>
                <h4 className="text-xs font-bold text-white">Customer Care 24/7</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Bantuan siap siaga kapanpun kamu membutuhkan via WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {/* PAYMENT METHODS BADGES */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-center">
              Dukungan Metode Pembayaran Resmi
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-bold text-zinc-300">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center gap-1 text-[#FECB2F]">
                <i className="fa-solid fa-qrcode"></i> QRIS Realtime
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80">DANA</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80">OVO</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80">ShopeePay</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80">BCA</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80">Mandiri</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80">BRI</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80">BNI</span>
            </div>
          </div>

          {/* FOOTER */}
          <footer className="pt-4 border-t border-zinc-800/80 flex flex-col items-center text-center gap-3 text-zinc-500 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-[#FECB2F] flex items-center justify-center text-zinc-950 text-xs font-black">
                Y
              </div>
              <span className="font-extrabold text-zinc-300 tracking-wider">YOKENTERTAIMENT</span>
            </div>
            
            <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
              Platform top up game & voucher terpercaya di Indonesia dengan pengiriman otomatis 24 jam nonstop.
            </p>

            <div className="flex items-center gap-4 text-sm text-zinc-400 pt-1">
              <a href="https://wa.me/" target="_blank" rel="noreferrer" className="hover:text-[#FECB2F] transition-colors" title="WhatsApp CS">
                <i className="fa-brands fa-whatsapp text-lg"></i>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:text-[#FECB2F] transition-colors" title="TikTok">
                <i className="fa-brands fa-tiktok text-lg"></i>
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-[#FECB2F] transition-colors" title="Discord">
                <i className="fa-brands fa-discord text-lg"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#FECB2F] transition-colors" title="Instagram">
                <i className="fa-brands fa-instagram text-lg"></i>
              </a>
            </div>

            <span className="text-[10px] text-zinc-600 pt-2">
              © {new Date().getFullYear()} YokEntertaiment. Hak cipta dilindungi undang-undang.
            </span>
          </footer>

        </div>

        {/* STICKY BOTTOM NAVIGATION DOCK (MOBILE FIRST) */}
        <nav className="fixed bottom-0 w-full max-w-md bg-[#0f0f12]/95 backdrop-blur-xl border-t border-zinc-800 flex justify-around items-center h-16 px-2 z-50 shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
          <Link
            href="/"
            className="flex flex-col items-center justify-center w-full h-full text-[#FECB2F] font-bold group"
          >
            <i className="fa-solid fa-house text-base mb-1"></i>
            <span className="text-[10px]">Beranda</span>
          </Link>

          <a
            href="#games-section"
            className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-[#FECB2F] transition-colors group"
          >
            <i className="fa-solid fa-gamepad text-base mb-1"></i>
            <span className="text-[10px]">Game</span>
          </a>

          <Link
            href="/reseller/vip/plan"
            className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-[#FECB2F] transition-colors group"
          >
            <div className="relative">
              <i className="fa-solid fa-crown text-base mb-1 text-amber-400"></i>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            </div>
            <span className="text-[10px]">VIP Plan</span>
          </Link>

          <button
            onClick={() => setShowTrackModal(true)}
            className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-[#FECB2F] transition-colors group"
          >
            <i className="fa-solid fa-receipt text-base mb-1"></i>
            <span className="text-[10px]">Lacak</span>
          </button>

          {currentUser ? (
            <Link
              href={currentUser.userLevel === "owner" ? "/owner/dashboard" : "/reseller/dashboard"}
              className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-[#FECB2F] transition-colors group"
            >
              <i className="fa-solid fa-user text-base mb-1"></i>
              <span className="text-[10px]">Akun</span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-[#FECB2F] transition-colors group"
            >
              <i className="fa-solid fa-arrow-right-to-bracket text-base mb-1"></i>
              <span className="text-[10px]">Masuk</span>
            </Link>
          )}
        </nav>

        {/* MODAL LACAK PESANAN */}
        {showTrackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-[#141418] border border-zinc-700/80 p-5 shadow-2xl flex flex-col gap-4 animate-modal-pop">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-[#FECB2F] flex items-center justify-center text-sm">
                    <i className="fa-solid fa-receipt"></i>
                  </div>
                  <h3 className="font-extrabold text-sm text-white">Lacak Status Pesanan</h3>
                </div>
                <button
                  onClick={() => setShowTrackModal(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-sm"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <p className="text-xs text-zinc-300">
                Masukkan nomor invoice transaksi kamu untuk mengecek status pembayaran & proses pesanan secara langsung:
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Nomor Invoice</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus-within:border-[#FECB2F]">
                  <i className="fa-solid fa-hashtag text-xs text-zinc-500"></i>
                  <input
                    type="text"
                    placeholder="Contoh: INV-20261013-XXXX"
                    value={trackInvoice}
                    onChange={(e) => setTrackInvoice(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    if (trackInvoice.trim()) {
                      window.location.href = `/reseller/payment/${encodeURIComponent(trackInvoice.trim())}`;
                    }
                  }}
                  disabled={!trackInvoice.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#FECB2F] disabled:opacity-50 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <i className="fa-solid fa-magnifying-glass text-xs"></i>
                  <span>Cek Pesanan</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
