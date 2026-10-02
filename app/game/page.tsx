"use client";

import Sidebar from "@/app/components/Sidebar";
import { useState, useEffect } from "react";
import { getGames, createGame, updateGame, deleteGame } from "./actions";

export default function GamePage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "" });

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

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Kelola Game</h1>
            <p className="mt-2 text-zinc-400">Daftar game yang tersedia di sistem.</p>
          </div>
          <button
            onClick={() => {
              setFormData({ id: "", name: "" });
              setIsModalOpen(true);
            }}
            className="rounded-xl bg-[#FECB2F] px-5 py-2.5 text-sm font-bold text-[#222222] shadow-[0_0_15px_-5px_#FECB2F] transition hover:bg-[#e5b62a]"
          >
            + Tambah Game
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#222222] shadow-lg">
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
              ) : games.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">Belum ada game.</td>
                </tr>
              ) : (
                games.map((game) => (
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
