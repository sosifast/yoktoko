"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import { useState, useEffect, useMemo } from "react";
import { getProduk, getDropdownData, createProduk, updateProduk, deleteProduk, bulkUpdateRate } from "./actions";

export default function ProdukPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    id_kategori: "",
    id_game: "",
    nama_produk: "",
    harga_jual: 0,
    rate_robux_suplier: 0,
    rate_robux_dijual: 0,
    harga_robux_sebelum_diskon: 0,
    harga_robux_sudah_diskon: 0,
    penggunaan_robux: 0,
    is_discount: false,
  });

  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("");
  const [selectedFilterGame, setSelectedFilterGame] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Update Rate Modal state
  const [isUpdateRateModalOpen, setIsUpdateRateModalOpen] = useState(false);
  const [rateFormData, setRateFormData] = useState({
    id_game: "",
    update_rate_suplier: true,
    rate_robux_suplier: 120,
    update_rate_jual: true,
    rate_robux_dijual: 125,
    update_harga_jual: true,
  });
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodData, dropData] = await Promise.all([
        getProduk(),
        getDropdownData()
      ]);
      setProducts(prodData);
      setCategories(dropData.categories);
      setGames(dropData.games);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto generate slug
    const generatedSlug = formData.nama_produk
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const payload = { ...formData, slug: generatedSlug };

    if (formData.id) {
      await updateProduk(formData.id, payload);
    } else {
      await createProduk(payload);
    }
    setIsModalOpen(false);
    setFormData({
      id: "", id_kategori: "", id_game: "", nama_produk: "", 
      harga_jual: 0, rate_robux_suplier: 0, rate_robux_dijual: 0,
      harga_robux_sebelum_diskon: 0, harga_robux_sudah_diskon: 0,
      penggunaan_robux: 0, is_discount: false
    });
    fetchData();
  };

  const handleEdit = (prod: any) => {
    setFormData({
      id: prod.id,
      id_kategori: prod.id_kategori || "",
      id_game: prod.id_game || "",
      nama_produk: prod.nama_produk,
      harga_jual: Number(prod.harga_jual),
      rate_robux_suplier: Number(prod.rate_robux_suplier),
      rate_robux_dijual: Number(prod.rate_robux_dijual),
      harga_robux_sebelum_diskon: Number(prod.harga_robux_sebelum_diskon || 0),
      harga_robux_sudah_diskon: Number(prod.harga_robux_sudah_diskon || 0),
      penggunaan_robux: Number(prod.penggunaan_robux || 0),
      is_discount: Boolean(prod.is_discount || false)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      await deleteProduk(id);
      fetchData();
    }
  };

  // Products affected by bulk rate update
  const affectedProductsCount = useMemo(() => {
    if (!rateFormData.id_game) return products.length;
    return products.filter((p) => p.id_game === rateFormData.id_game).length;
  }, [products, rateFormData.id_game]);

  const handleBulkUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateFormData.update_rate_suplier && !rateFormData.update_rate_jual) {
      alert("Centang setidaknya salah satu rate (Rate Suplier atau Rate Jual) untuk diperbarui.");
      return;
    }

    const gameName = rateFormData.id_game
      ? games.find((g) => g.id === rateFormData.id_game)?.name || "Game terpilih"
      : "Semua Game";

    const confirmMsg = `Perbarui rate untuk ${affectedProductsCount} produk pada "${gameName}"?`;
    if (!confirm(confirmMsg)) return;

    setIsUpdatingRate(true);
    try {
      const res = await bulkUpdateRate({
        id_game: rateFormData.id_game || undefined,
        update_rate_suplier: rateFormData.update_rate_suplier,
        rate_robux_suplier: Number(rateFormData.rate_robux_suplier),
        update_rate_jual: rateFormData.update_rate_jual,
        rate_robux_dijual: Number(rateFormData.rate_robux_dijual),
        update_harga_jual: rateFormData.update_harga_jual,
      });

      alert(`Berhasil memperbarui rate untuk ${res.updatedCount} produk!`);
      setIsUpdateRateModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal memperbarui rate.");
    } finally {
      setIsUpdatingRate(false);
    }
  };

  // Filtered & Paginated items
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (selectedFilterCategory && prod.id_kategori !== selectedFilterCategory) {
        return false;
      }
      // Game filter
      if (selectedFilterGame && prod.id_game !== selectedFilterGame) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = prod.nama_produk?.toLowerCase().includes(query);
        const matchesSlug = prod.slug?.toLowerCase().includes(query);
        const matchesCat = prod.kategori_name?.toLowerCase().includes(query);
        const matchesGame = prod.game_name?.toLowerCase().includes(query);
        if (!matchesName && !matchesSlug && !matchesCat && !matchesGame) {
          return false;
        }
      }
      return true;
    });
  }, [products, searchQuery, selectedFilterCategory, selectedFilterGame]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Kelola Produk</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setRateFormData((prev) => ({
                  ...prev,
                  id_game: selectedFilterGame || prev.id_game || "",
                }));
                setIsUpdateRateModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl border border-[#FECB2F]/40 bg-[#FECB2F]/10 px-4 py-2.5 text-sm font-bold text-[#FECB2F] shadow-sm transition hover:bg-[#FECB2F]/20 hover:border-[#FECB2F]"
            >
              <i className="fa-solid fa-tags text-sm"></i>
              Update Rate Masal
            </button>
            <button
              onClick={() => {
                setFormData({
                  id: "", id_kategori: "", id_game: "", nama_produk: "", 
                  harga_jual: 0, rate_robux_suplier: 0, rate_robux_dijual: 0,
                  harga_robux_sebelum_diskon: 0, harga_robux_sudah_diskon: 0,
                  penggunaan_robux: 0, is_discount: false
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-[#FECB2F] px-5 py-2.5 text-sm font-bold text-[#222222] shadow-[0_0_15px_-5px_#FECB2F] transition hover:bg-[#e5b62a] shrink-0"
            >
              <i className="fa-solid fa-plus text-sm"></i>
              Tambah Produk
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                <i className="fa-solid fa-magnifying-glass text-xs"></i>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari produk (nama, slug, dll)..."
                className="w-full rounded-xl border border-white/10 bg-[#222222] pl-10 pr-9 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
                  title="Hapus pencarian"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              )}
            </div>

            {/* Filter by Category */}
            <select
              value={selectedFilterCategory}
              onChange={(e) => {
                setSelectedFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter berdasarkan Kategori"
              className="rounded-xl border border-white/10 bg-[#222222] px-3.5 py-2.5 text-sm text-zinc-300 outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filter by Game */}
            <select
              value={selectedFilterGame}
              onChange={(e) => {
                setSelectedFilterGame(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter berdasarkan Game"
              className="rounded-xl border border-white/10 bg-[#222222] px-3.5 py-2.5 text-sm text-zinc-300 outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
            >
              <option value="">Semua Game</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-zinc-400 self-end lg:self-center shrink-0">
            Total Produk: <span className="font-bold text-white">{filteredProducts.length}</span>
            {(searchQuery || selectedFilterCategory || selectedFilterGame) && ` (dari ${products.length})`}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#222222] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-[#333] bg-[#1a1a1a] text-zinc-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Produk</th>
                  <th className="px-6 py-4 font-semibold">Kategori & Game</th>
                  <th className="px-6 py-4 font-semibold">Harga Jual</th>
                  <th className="px-6 py-4 font-semibold">Rate Suplier</th>
                  <th className="px-6 py-4 font-semibold">Rate Jual</th>
                  <th className="px-6 py-4 font-semibold">Robux</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">Memuat data...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      {searchQuery || selectedFilterCategory || selectedFilterGame
                        ? "Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih."
                        : "Belum ada produk."}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#2a2a2a] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">
                        {prod.nama_produk}
                        <div className="text-xs text-zinc-500 mt-1">{prod.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-[#333] px-2 py-1 rounded text-xs mr-2">{prod.kategori_name || "-"}</span>
                        <span className="bg-[#FECB2F]/20 text-[#FECB2F] px-2 py-1 rounded text-xs">{prod.game_name || "-"}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">Rp {Number(prod.harga_jual).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4">{Number(prod.rate_robux_suplier)}</td>
                      <td className="px-6 py-4">{Number(prod.rate_robux_dijual)}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-zinc-200">{Number(prod.penggunaan_robux || 0)} R$</span>
                        {prod.is_discount && (
                          <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            Diskon
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => handleEdit(prod)} className="text-[#FECB2F] hover:underline font-semibold transition inline-flex items-center gap-1.5">
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(prod.id)} className="text-red-500 hover:underline font-semibold transition inline-flex items-center gap-1.5">
                          <i className="fa-solid fa-trash-can text-xs"></i>
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredProducts.length > 0 && (
            <Pagination
              currentPage={safeCurrentPage}
              totalItems={filteredProducts.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </div>

        {/* Modal form CRUD */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#222222] p-8 shadow-2xl my-8">
              <h2 className="text-2xl font-extrabold text-white mb-6">
                {formData.id ? "Edit Produk" : "Tambah Produk"}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                
                <div>
                  <label className="text-sm font-semibold text-zinc-300">Nama Produk</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_produk}
                    onChange={(e) => setFormData({ ...formData, nama_produk: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    placeholder="Contoh: 100 Robux"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">Kategori</label>
                    <select
                      required
                      value={formData.id_kategori}
                      onChange={(e) => setFormData({ ...formData, id_kategori: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    >
                      <option value="" disabled>Pilih Kategori</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">Game</label>
                    <select
                      required
                      value={formData.id_game}
                      onChange={(e) => setFormData({ ...formData, id_game: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    >
                      <option value="" disabled>Pilih Game</option>
                      {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-zinc-300">Harga Jual (Rp)</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 font-semibold">Rp</span>
                    <input
                      type="text"
                      required
                      value={formData.harga_jual === 0 ? "" : formData.harga_jual.toLocaleString("id-ID")}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, harga_jual: Number(rawValue) });
                      }}
                      className="block w-full rounded-xl border border-white/10 bg-[#1a1a1a] pl-12 pr-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">Rate Suplier</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.rate_robux_suplier}
                      onChange={(e) => setFormData({ ...formData, rate_robux_suplier: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">Rate Jual</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.rate_robux_dijual}
                      onChange={(e) => {
                        const rate = Number(e.target.value);
                        setFormData({ 
                          ...formData, 
                          rate_robux_dijual: rate,
                          harga_jual: rate * formData.penggunaan_robux
                        });
                      }}
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">Harga Robux (Sblm Diskon)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.harga_robux_sebelum_diskon}
                      onChange={(e) => setFormData({ ...formData, harga_robux_sebelum_diskon: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">Harga Robux (Sdh Diskon)</label>
                    <input
                      type="number"
                      required={formData.is_discount}
                      disabled={!formData.is_discount}
                      min="0"
                      value={formData.harga_robux_sudah_diskon}
                      onChange={(e) => setFormData({ ...formData, harga_robux_sudah_diskon: Number(e.target.value) })}
                      className={`mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition ${!formData.is_discount ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">Penggunaan Robux</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.penggunaan_robux}
                      onChange={(e) => {
                        const penggunaan = Number(e.target.value);
                        setFormData({ 
                          ...formData, 
                          penggunaan_robux: penggunaan,
                          harga_jual: penggunaan * formData.rate_robux_dijual
                        });
                      }}
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    />
                  </div>
                  <div className="flex items-center mt-6">
                    <input
                      type="checkbox"
                      id="is_discount"
                      checked={formData.is_discount}
                      onChange={(e) => setFormData({ ...formData, is_discount: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-[#1a1a1a] text-[#FECB2F] focus:ring-[#FECB2F] focus:ring-offset-0"
                    />
                    <label htmlFor="is_discount" className="ml-3 text-sm font-semibold text-zinc-300">
                      Aktifkan Diskon
                    </label>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#FECB2F] px-6 py-2.5 text-sm font-bold text-[#222222] hover:bg-[#e5b62a] transition shadow-[0_0_15px_-5px_#FECB2F]"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Update Rate Masal */}
        {isUpdateRateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#1e1e1e] p-6 sm:p-8 shadow-2xl my-8 text-white animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FECB2F]/20 text-[#FECB2F]">
                    <i className="fa-solid fa-tags text-base"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">Update Rate Masal</h2>
                    <p className="text-xs text-zinc-400">Perbarui rate suplier & rate jual untuk produk</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpdateRateModalOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition"
                  aria-label="Tutup Modal"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <form onSubmit={handleBulkUpdateRate} className="mt-6 space-y-5">
                {/* Pilih Game */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Pilih Game Target
                  </label>
                  <select
                    value={rateFormData.id_game}
                    onChange={(e) => setRateFormData({ ...rateFormData, id_game: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                  >
                    <option value="">Semua Game ({products.length} total produk)</option>
                    {games.map((g) => {
                      const count = products.filter((p) => p.id_game === g.id).length;
                      return (
                        <option key={g.id} value={g.id}>
                          {g.name} ({count} produk)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Section Rate Suplier */}
                <div className={`rounded-2xl border p-4 transition-colors ${
                  rateFormData.update_rate_suplier 
                    ? "border-[#FECB2F]/40 bg-[#FECB2F]/5" 
                    : "border-white/5 bg-[#141414]/50 opacity-60"
                }`}>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rateFormData.update_rate_suplier}
                      onChange={(e) =>
                        setRateFormData({ ...rateFormData, update_rate_suplier: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-white/20 bg-black text-[#FECB2F] focus:ring-[#FECB2F] focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-bold text-white">Update Rate Suplier</span>
                      <p className="text-xs text-zinc-400">Aktifkan untuk mengubah rate suplier produk terpilih</p>
                    </div>
                  </label>

                  {rateFormData.update_rate_suplier && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Nilai Rate Suplier Baru
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required={rateFormData.update_rate_suplier}
                        value={rateFormData.rate_robux_suplier}
                        onChange={(e) =>
                          setRateFormData({ ...rateFormData, rate_robux_suplier: Number(e.target.value) })
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 text-sm text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                        placeholder="Contoh: 120"
                      />
                    </div>
                  )}
                </div>

                {/* Section Rate Jual */}
                <div className={`rounded-2xl border p-4 transition-colors ${
                  rateFormData.update_rate_jual 
                    ? "border-[#FECB2F]/40 bg-[#FECB2F]/5" 
                    : "border-white/5 bg-[#141414]/50 opacity-60"
                }`}>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rateFormData.update_rate_jual}
                      onChange={(e) =>
                        setRateFormData({ ...rateFormData, update_rate_jual: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-white/20 bg-black text-[#FECB2F] focus:ring-[#FECB2F] focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-bold text-white">Update Rate Jual</span>
                      <p className="text-xs text-zinc-400">Aktifkan untuk mengubah rate jual produk terpilih</p>
                    </div>
                  </label>

                  {rateFormData.update_rate_jual && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Nilai Rate Jual Baru
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required={rateFormData.update_rate_jual}
                          value={rateFormData.rate_robux_dijual}
                          onChange={(e) =>
                            setRateFormData({ ...rateFormData, rate_robux_dijual: Number(e.target.value) })
                          }
                          className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 text-sm text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                          placeholder="Contoh: 125"
                        />
                      </div>

                      <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rateFormData.update_harga_jual}
                          onChange={(e) =>
                            setRateFormData({ ...rateFormData, update_harga_jual: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-white/20 bg-black text-[#FECB2F] focus:ring-[#FECB2F] focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-xs text-zinc-300 font-medium">
                          Otomatis perbarui <span className="text-white font-semibold">Harga Jual</span> (Harga Jual = Rate Jual × Penggunaan Robux)
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Target Preview Box */}
                <div className="rounded-xl border border-white/10 bg-[#141414] p-3.5 flex items-center justify-between text-xs">
                  <div className="text-zinc-400">
                    Jumlah produk terdampak:
                  </div>
                  <div className="font-extrabold text-[#FECB2F] text-sm">
                    {affectedProductsCount} Produk
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    disabled={isUpdatingRate}
                    onClick={() => setIsUpdateRateModalOpen(false)}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingRate || (!rateFormData.update_rate_suplier && !rateFormData.update_rate_jual)}
                    className="flex items-center gap-2 rounded-xl bg-[#FECB2F] px-6 py-2.5 text-sm font-bold text-[#222222] shadow-[0_0_15px_-5px_#FECB2F] transition hover:bg-[#e5b62a] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingRate ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Memproses...
                      </>
                    ) : (
                      "Terapkan Perubahan"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
