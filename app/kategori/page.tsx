"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import { useState, useEffect, useMemo } from "react";
import { getKategori, createKategori, updateKategori, deleteKategori } from "./actions";

export default function KategoriPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", slug: "" });

  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getKategori();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const generatedSlug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const payload = { ...formData, slug: generatedSlug };

    if (formData.id) {
      await updateKategori(formData.id, payload);
    } else {
      await createKategori(payload);
    }
    setIsModalOpen(false);
    setFormData({ id: "", name: "", slug: "" });
    fetchCategories();
  };

  const handleEdit = (cat: any) => {
    setFormData({ id: cat.id, name: cat.name, slug: cat.slug });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
      await deleteKategori(id);
      fetchCategories();
    }
  };

  // Filtered & Paginated items
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase().trim();
    return categories.filter(
      (cat) =>
        cat.name?.toLowerCase().includes(query) ||
        cat.slug?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + pageSize);

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Kelola Kategori</h1>
          </div>
          <button
            onClick={() => {
              setFormData({ id: "", name: "", slug: "" });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#FECB2F] px-5 py-2.5 text-sm font-bold text-[#222222] shadow-[0_0_15px_-5px_#FECB2F] transition hover:bg-[#e5b62a] shrink-0"
          >
            <i className="fa-solid fa-plus text-sm"></i>
            Tambah Kategori
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
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
              placeholder="Cari kategori (nama atau slug)..."
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

          <div className="text-xs text-zinc-400 self-end sm:self-center">
            Total Kategori: <span className="font-bold text-white">{filteredCategories.length}</span>
            {searchQuery && ` (dari ${categories.length})`}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#222222] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-[#333] bg-[#1a1a1a] text-zinc-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Kategori</th>
                  <th className="px-6 py-4 font-semibold">Slug</th>
                  <th className="px-6 py-4 font-semibold">Tanggal Dibuat</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">Memuat data...</td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">
                      {searchQuery
                        ? `Tidak ada kategori yang cocok dengan "${searchQuery}".`
                        : "Belum ada kategori."}
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#2a2a2a] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{cat.name}</td>
                      <td className="px-6 py-4">{cat.slug}</td>
                      <td className="px-6 py-4">{new Date(cat.create_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => handleEdit(cat)} className="text-[#FECB2F] hover:underline font-semibold transition inline-flex items-center gap-1.5">
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:underline font-semibold transition inline-flex items-center gap-1.5">
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
          {!loading && filteredCategories.length > 0 && (
            <Pagination
              currentPage={safeCurrentPage}
              totalItems={filteredCategories.length}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#222222] p-8 shadow-2xl">
              <h2 className="text-2xl font-extrabold text-white mb-6">
                {formData.id ? "Edit Kategori" : "Tambah Kategori"}
              </h2>
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-zinc-300">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    placeholder="Contoh: MOBA"
                  />
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
