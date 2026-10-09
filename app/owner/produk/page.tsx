"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import { useState, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getProduk, getDropdownData, createProduk, updateProduk, deleteProduk, bulkUpdateRate } from "./actions";

export default function ProdukPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: "" });
  const [bulkConfirmModal, setBulkConfirmModal] = useState({ isOpen: false, gameName: "", count: 0 });
  const [formData, setFormData] = useState({
    id: "",
    id_kategori: "",
    id_game: "",
    nama_produk: "",
    harga_jual: 0,
    rate_robux_suplier: 0,
    rate_robux_dijual: 0,
    rate_robux_reseller: 0,
    harga_reseller: 0,
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
    update_rate_reseller: true,
    rate_robux_reseller: 123,
    update_harga_reseller: true,
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

    try {
      if (formData.id) {
        await updateProduk(formData.id, payload);
        toast.success("Produk berhasil diperbarui!");
      } else {
        await createProduk(payload);
        toast.success("Produk berhasil ditambahkan!");
      }
      setIsModalOpen(false);
      setFormData({
        id: "", id_kategori: "", id_game: "", nama_produk: "", 
        harga_jual: 0, rate_robux_suplier: 0, rate_robux_dijual: 0,
        rate_robux_reseller: 0, harga_reseller: 0,
        harga_robux_sebelum_diskon: 0, harga_robux_sudah_diskon: 0,
        penggunaan_robux: 0, is_discount: false
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menyimpan produk.");
    }
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
      rate_robux_reseller: Number(prod.rate_robux_reseller || 0),
      harga_reseller: Number(prod.harga_reseller || 0),
      harga_robux_sebelum_diskon: Number(prod.harga_robux_sebelum_diskon || 0),
      harga_robux_sudah_diskon: Number(prod.harga_robux_sudah_diskon || 0),
      penggunaan_robux: Number(prod.penggunaan_robux || 0),
      is_discount: Boolean(prod.is_discount || false)
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    try {
      await deleteProduk(deleteModal.id);
      toast.success("Produk berhasil dihapus!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menghapus produk.");
    } finally {
      setDeleteModal({ isOpen: false, id: "" });
    }
  };

  // Products affected by bulk rate update
  const affectedProductsCount = useMemo(() => {
    if (!rateFormData.id_game) return products.length;
    return products.filter((p) => p.id_game === rateFormData.id_game).length;
  }, [products, rateFormData.id_game]);

  const handleBulkUpdateRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateFormData.update_rate_suplier && !rateFormData.update_rate_jual && !rateFormData.update_rate_reseller) {
      toast.error("Centang setidaknya salah satu rate (Supplier, Selling, atau Reseller Rate) untuk updated.");
      return;
    }

    const gameName = rateFormData.id_game
      ? games.find((g) => g.id === rateFormData.id_game)?.name || "Game terpilih"
      : "All Games";

    setBulkConfirmModal({ isOpen: true, gameName, count: affectedProductsCount });
  };

  const executeBulkUpdate = async () => {
    setIsUpdatingRate(true);
    setBulkConfirmModal({ ...bulkConfirmModal, isOpen: false });
    try {
      const res = await bulkUpdateRate({
        id_game: rateFormData.id_game || undefined,
        update_rate_suplier: rateFormData.update_rate_suplier,
        rate_robux_suplier: Number(rateFormData.rate_robux_suplier),
        update_rate_jual: rateFormData.update_rate_jual,
        rate_robux_dijual: Number(rateFormData.rate_robux_dijual),
        update_harga_jual: rateFormData.update_harga_jual,
        update_rate_reseller: rateFormData.update_rate_reseller,
        rate_robux_reseller: Number(rateFormData.rate_robux_reseller),
        update_harga_reseller: rateFormData.update_harga_reseller,
      });

      toast.success(`Success memperbarui rate untuk ${res.updatedCount} produk!`);
      setIsUpdateRateModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed memperbarui rate.");
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
      <Toaster position="top-right" />
      <div className="p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Manage Products</h1>
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
              Bulk Update Rate
            </button>
            <button
              onClick={() => {
                setFormData({
                  id: "", id_kategori: "", id_game: "", nama_produk: "", 
                  harga_jual: 0, rate_robux_suplier: 0, rate_robux_dijual: 0,
                  rate_robux_reseller: 0, harga_reseller: 0,
                  harga_robux_sebelum_diskon: 0, harga_robux_sudah_diskon: 0,
                  penggunaan_robux: 0, is_discount: false
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-[#FECB2F] px-5 py-2.5 text-sm font-bold text-[#222222] shadow-[0_0_15px_-5px_#FECB2F] transition hover:bg-[#e5b62a] shrink-0"
            >
              <i className="fa-solid fa-plus text-sm"></i>
              Add Product
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
                placeholder="Search products (nama, slug, dll)..."
                className="w-full rounded-xl border border-white/10 bg-[#222222] pl-10 pr-9 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
                  title="Delete pencarian"
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
              <option value="">All Categories</option>
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
              <option value="">All Games</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-zinc-400 self-end lg:self-center shrink-0">
            Total Products: <span className="font-bold text-white">{filteredProducts.length}</span>
            {(searchQuery || selectedFilterCategory || selectedFilterGame) && ` (dari ${products.length})`}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#222222] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-[#333] bg-[#1a1a1a] text-zinc-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product Name</th>
                  <th className="px-6 py-4 font-semibold">Category & Game</th>
                  <th className="px-6 py-4 font-semibold">Selling Price</th>
                  <th className="px-6 py-4 font-semibold">Reseller Price</th>
                  <th className="px-6 py-4 font-semibold">Supplier Rate</th>
                  <th className="px-6 py-4 font-semibold">Selling Rate</th>
                  <th className="px-6 py-4 font-semibold">Reseller Rate</th>
                  <th className="px-6 py-4 font-semibold">Robux</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-zinc-500">Loading data...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-zinc-500">
                      {searchQuery || selectedFilterCategory || selectedFilterGame
                        ? "No products match dengan pencarian atau filter yang dipilih."
                        : "No products yet."}
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
                      <td className="px-6 py-4 font-bold text-zinc-300">Rp {Number(prod.harga_reseller || 0).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4">{Number(prod.rate_robux_suplier)}</td>
                      <td className="px-6 py-4">{Number(prod.rate_robux_dijual)}</td>
                      <td className="px-6 py-4">{Number(prod.rate_robux_reseller || 0)}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-zinc-200">{Number(prod.penggunaan_robux || 0)} R$</span>
                        {prod.is_discount && (
                          <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            Discount
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
                          Delete
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
                {formData.id ? "Edit Produk" : "Add Product"}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                
                <div>
                  <label className="text-sm font-semibold text-zinc-300">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_produk}
                    onChange={(e) => setFormData({ ...formData, nama_produk: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    placeholder="Example: 100 Robux"
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
                      <option value="" disabled>Select Category</option>
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
                      <option value="" disabled>Select Game</option>
                      {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-zinc-300">Selling Price (Rp)</label>
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
                    <label className="text-sm font-semibold text-zinc-300">Supplier Rate</label>
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
                    <label className="text-sm font-semibold text-zinc-300">Selling Rate</label>
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
                    <label className="text-sm font-semibold text-zinc-300">Reseller Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.rate_robux_reseller}
                      onChange={(e) => {
                        const rate = Number(e.target.value);
                        setFormData({ 
                          ...formData, 
                          rate_robux_reseller: rate,
                          harga_reseller: rate * formData.penggunaan_robux
                        });
                      }}
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">Reseller Price (Rp)</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 font-semibold">Rp</span>
                      <input
                        type="text"
                        required
                        value={formData.harga_reseller === 0 ? "" : formData.harga_reseller.toLocaleString("id-ID")}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, "");
                          setFormData({ ...formData, harga_reseller: Number(rawValue) });
                        }}
                        className="block w-full rounded-xl border border-white/10 bg-[#1a1a1a] pl-12 pr-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-zinc-300">Harga Robux (Sblm Discount)</label>
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
                    <label className="text-sm font-semibold text-zinc-300">Harga Robux (Sdh Discount)</label>
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
                    <label className="text-sm font-semibold text-zinc-300">Robux Usage</label>
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
                          harga_jual: penggunaan * formData.rate_robux_dijual,
                          harga_reseller: penggunaan * formData.rate_robux_reseller
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
                      Aktifkan Discount
                    </label>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#FECB2F] px-6 py-2.5 text-sm font-bold text-[#222222] hover:bg-[#e5b62a] transition shadow-[0_0_15px_-5px_#FECB2F]"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Bulk Update Rate */}
        {isUpdateRateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#1e1e1e] p-6 sm:p-8 shadow-2xl my-8 text-white animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FECB2F]/20 text-[#FECB2F]">
                    <i className="fa-solid fa-tags text-base"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">Bulk Update Rate</h2>
                    <p className="text-xs text-zinc-400">Update rate suplier & rate jual untuk produk</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpdateRateModalOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition"
                  aria-label="Close Modal"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <form onSubmit={handleBulkUpdateRate} className="mt-6 space-y-5">
                {/* Select Game */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Select Game Target
                  </label>
                  <select
                    value={rateFormData.id_game}
                    onChange={(e) => setRateFormData({ ...rateFormData, id_game: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                  >
                    <option value="">All Games ({products.length} total produk)</option>
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

                {/* Section Supplier Rate */}
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
                      <span className="text-sm font-bold text-white">Update Supplier Rate</span>
                      <p className="text-xs text-zinc-400">Aktifkan untuk mengubah rate suplier produk terpilih</p>
                    </div>
                  </label>

                  {rateFormData.update_rate_suplier && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Nilai Supplier Rate Baru
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
                        placeholder="Example: 120"
                      />
                    </div>
                  )}
                </div>

                {/* Section Selling Rate */}
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
                      <span className="text-sm font-bold text-white">Update Selling Rate</span>
                      <p className="text-xs text-zinc-400">Aktifkan untuk mengubah rate jual produk terpilih</p>
                    </div>
                  </label>

                  {rateFormData.update_rate_jual && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Nilai Selling Rate Baru
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
                          placeholder="Example: 125"
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
                          Automatically update <span className="text-white font-semibold">Selling Price</span> (Selling Price = Selling Rate × Robux Usage)
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Section Reseller Rate */}
                <div className={`rounded-2xl border p-4 transition-colors ${
                  rateFormData.update_rate_reseller 
                    ? "border-[#FECB2F]/40 bg-[#FECB2F]/5" 
                    : "border-white/5 bg-[#141414]/50 opacity-60"
                }`}>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rateFormData.update_rate_reseller}
                      onChange={(e) =>
                        setRateFormData({ ...rateFormData, update_rate_reseller: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-white/20 bg-black text-[#FECB2F] focus:ring-[#FECB2F] focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-bold text-white">Update Reseller Rate</span>
                      <p className="text-xs text-zinc-400">Aktifkan untuk mengubah rate reseller produk terpilih</p>
                    </div>
                  </label>

                  {rateFormData.update_rate_reseller && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Nilai Reseller Rate Baru
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required={rateFormData.update_rate_reseller}
                          value={rateFormData.rate_robux_reseller}
                          onChange={(e) =>
                            setRateFormData({ ...rateFormData, rate_robux_reseller: Number(e.target.value) })
                          }
                          className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 text-sm text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                          placeholder="Example: 123"
                        />
                      </div>

                      <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rateFormData.update_harga_reseller}
                          onChange={(e) =>
                            setRateFormData({ ...rateFormData, update_harga_reseller: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-white/20 bg-black text-[#FECB2F] focus:ring-[#FECB2F] focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-xs text-zinc-300 font-medium">
                          Automatically update <span className="text-white font-semibold">Reseller Price</span> (Reseller Price = Reseller Rate × Robux Usage)
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Target Preview Box */}
                <div className="rounded-xl border border-white/10 bg-[#141414] p-3.5 flex items-center justify-between text-xs">
                  <div className="text-zinc-400">
                    Affected products count:
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingRate || (!rateFormData.update_rate_suplier && !rateFormData.update_rate_jual && !rateFormData.update_rate_reseller)}
                    className="flex items-center gap-2 rounded-xl bg-[#FECB2F] px-6 py-2.5 text-sm font-bold text-[#222222] shadow-[0_0_15px_-5px_#FECB2F] transition hover:bg-[#e5b62a] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingRate ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Apply Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#222222] p-6 shadow-2xl">
              <div className="flex justify-center mb-4 text-red-500">
                <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Hapus Produk?</h3>
              <p className="text-zinc-400 text-center text-sm mb-6">
                Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus produk ini?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, id: "" })}
                  className="flex-1 rounded-xl bg-[#333] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#444]"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Update Confirmation Modal */}
        {bulkConfirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#222222] p-6 shadow-2xl">
              <div className="flex justify-center mb-4 text-[#FECB2F]">
                <i className="fa-solid fa-circle-question text-4xl"></i>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Konfirmasi Bulk Update</h3>
              <p className="text-zinc-400 text-center text-sm mb-6">
                Anda akan memperbarui rate untuk <span className="font-bold text-white">{bulkConfirmModal.count} produk</span> pada kategori <span className="font-bold text-white">"{bulkConfirmModal.gameName}"</span>. Lanjutkan?
              </p>
              <div className="flex gap-3">
                <button
                  disabled={isUpdatingRate}
                  onClick={() => setBulkConfirmModal({ isOpen: false, gameName: "", count: 0 })}
                  className="flex-1 rounded-xl bg-[#333] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#444]"
                >
                  Batal
                </button>
                <button
                  disabled={isUpdatingRate}
                  onClick={executeBulkUpdate}
                  className="flex-1 rounded-xl bg-[#FECB2F] px-4 py-2.5 text-sm font-bold text-[#222222] transition hover:bg-[#e5b62a] flex items-center justify-center gap-2"
                >
                  {isUpdatingRate ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      Loading...
                    </>
                  ) : (
                    "Ya, Lanjutkan"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
