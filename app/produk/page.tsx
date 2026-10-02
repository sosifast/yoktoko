"use client";

import Sidebar from "@/app/components/Sidebar";
import { useState, useEffect } from "react";
import { getProduk, getDropdownData, createProduk, updateProduk, deleteProduk } from "./actions";

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
  });

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
      harga_robux_sebelum_diskon: 0, harga_robux_sudah_diskon: 0
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
      harga_robux_sudah_diskon: Number(prod.harga_robux_sudah_diskon || 0)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      await deleteProduk(id);
      fetchData();
    }
  };

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Kelola Produk</h1>
            <p className="mt-2 text-zinc-400">Daftar produk item atau voucher di sistem.</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                id: "", id_kategori: "", id_game: "", nama_produk: "", 
                harga_jual: 0, rate_robux_suplier: 0, rate_robux_dijual: 0,
                harga_robux_sebelum_diskon: 0, harga_robux_sudah_diskon: 0
              });
              setIsModalOpen(true);
            }}
            className="rounded-xl bg-[#FECB2F] px-5 py-2.5 text-sm font-bold text-[#222222] shadow-[0_0_15px_-5px_#FECB2F] transition hover:bg-[#e5b62a]"
          >
            + Tambah Produk
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#222222] shadow-lg">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="border-b border-[#333] bg-[#1a1a1a] text-zinc-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Produk</th>
                <th className="px-6 py-4 font-semibold">Kategori & Game</th>
                <th className="px-6 py-4 font-semibold">Harga Jual</th>
                <th className="px-6 py-4 font-semibold">Rate Suplier</th>
                <th className="px-6 py-4 font-semibold">Rate Jual</th>
                <th className="px-6 py-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">Memuat data...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">Belum ada produk.</td>
                </tr>
              ) : (
                products.map((prod) => (
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
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => handleEdit(prod)} className="text-[#FECB2F] hover:underline font-semibold transition">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(prod.id)} className="text-red-500 hover:underline font-semibold transition">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                      onChange={(e) => setFormData({ ...formData, rate_robux_dijual: Number(e.target.value) })}
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
                      required
                      min="0"
                      value={formData.harga_robux_sudah_diskon}
                      onChange={(e) => setFormData({ ...formData, harga_robux_sudah_diskon: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    />
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
      </div>
    </Sidebar>
  );
}
