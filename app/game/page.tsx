"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import { useState, useEffect, useMemo } from "react";
import { getGames, createGame, updateGame, deleteGame } from "./actions";

export default function GamePage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "" });

  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const data = await getGames();
      setGames(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto generate slug
    const generatedSlug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const payload = { name: formData.name, slug: generatedSlug };

    if (formData.id) {
      await updateGame(formData.id, payload);
    } else {
      await createGame(payload);
    }
    setIsModalOpen(false);
    setFormData({ id: "", name: "" });
    fetchGames();
  };

  const handleEdit = (game: any) => {
    setFormData({ id: game.id, name: game.name });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus game ini?")) {
      await deleteGame(id);
      fetchGames();
    }
  };

  // Filtered & Paginated items
  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return games;
    const query = searchQuery.toLowerCase().trim();
    return games.filter(
      (game) =>
        game.name?.toLowerCase().includes(query) ||
        game.slug?.toLowerCase().includes(query)
    );
  }, [games, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredGames.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedGames = filteredGames.slice(startIndex, startIndex + pageSize);

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Kelola Game</h1>
          </div>
          <button
            onClick={() => {
              setFormData({ id: "", name: "" });
              setIsModalOpen(true);
            }}
            className="rounded-xl bg-[#FECB2F] px-5 py-2.5 text-sm font-bold text-[#222222] shadow-[0_0_15px_-5px_#FECB2F] transition hover:bg-[#e5b62a] shrink-0"
          >
            + Tambah Game
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari game (nama atau slug)..."
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="text-xs text-zinc-400 self-end sm:self-center">
            Total Game: <span className="font-bold text-white">{filteredGames.length}</span>
            {searchQuery && ` (dari ${games.length})`}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#222222] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-[#333] bg-[#1a1a1a] text-zinc-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Game</th>
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
                ) : filteredGames.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">
                      {searchQuery
                        ? `Tidak ada game yang cocok dengan "${searchQuery}".`
                        : "Belum ada game."}
                    </td>
                  </tr>
                ) : (
                  paginatedGames.map((game) => (
                    <tr key={game.id} className="hover:bg-[#2a2a2a] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{game.name}</td>
                      <td className="px-6 py-4">{game.slug}</td>
                      <td className="px-6 py-4">{new Date(game.create_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => handleEdit(game)} className="text-[#FECB2F] hover:underline font-semibold transition">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(game.id)} className="text-red-500 hover:underline font-semibold transition">
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
          {!loading && filteredGames.length > 0 && (
            <Pagination
              currentPage={safeCurrentPage}
              totalItems={filteredGames.length}
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
                {formData.id ? "Edit Game" : "Tambah Game"}
              </h2>
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-zinc-300">Nama Game</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    placeholder="Contoh: Mobile Legends"
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
