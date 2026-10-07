"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import { useState, useEffect, useMemo, useRef } from "react";
import { getGames, createGame, updateGame, deleteGame } from "./actions";
import { IKContext, IKUpload } from "imagekitio-react";

export default function GamePage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", image_url: "" });
  const [uploading, setUploading] = useState(false);
  const ikUploadRef = useRef<HTMLInputElement>(null);

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

    const payload = { name: formData.name, slug: generatedSlug, image_url: formData.image_url };

    if (formData.id) {
      await updateGame(formData.id, payload);
    } else {
      await createGame(payload);
    }
    setIsModalOpen(false);
    setFormData({ id: "", name: "", image_url: "" });
    fetchGames();
  };

  const handleEdit = (game: any) => {
    setFormData({ id: game.id, name: game.name, image_url: game.image_url || "" });
    setIsModalOpen(true);
  };

  const authenticator = async () => {
    try {
      const response = await fetch("/api/imagekit/auth");
      if (!response.ok) {
        throw new Error("Authentication request failed");
      }
      const data = await response.json();
      return { signature: data.signature, expire: data.expire, token: data.token };
    } catch (error: any) {
      throw new Error(`Authentication request failed: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete game ini?")) {
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
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Manage Games</h1>
          </div>
          <button
            onClick={() => {
              setFormData({ id: "", name: "", image_url: "" });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#FECB2F] px-5 py-2.5 text-sm font-bold text-[#222222] shadow-[0_0_15px_-5px_#FECB2F] transition hover:bg-[#e5b62a] shrink-0"
          >
            <i className="fa-solid fa-plus text-sm"></i>
            Add Game
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
              placeholder="Search game (nama atau slug)..."
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
                  <th className="px-6 py-4 font-semibold">Image</th>
                  <th className="px-6 py-4 font-semibold">Game Name</th>
                  <th className="px-6 py-4 font-semibold">Slug</th>
                  <th className="px-6 py-4 font-semibold">Tanggal Dibuat</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">Loading data...</td>
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
                      <td className="px-6 py-4">
                        {game.image_url ? (
                          <img src={game.image_url} alt={game.name} className="h-10 w-10 rounded-lg object-cover bg-zinc-800" />
                        ) : (
                          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 text-xs">
                            <i className="fa-solid fa-image"></i>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">{game.name}</td>
                      <td className="px-6 py-4">{game.slug}</td>
                      <td className="px-6 py-4">{new Date(game.create_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => handleEdit(game)} className="text-[#FECB2F] hover:underline font-semibold transition inline-flex items-center gap-1.5">
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(game.id)} className="text-red-500 hover:underline font-semibold transition inline-flex items-center gap-1.5">
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
                {formData.id ? "Edit Game" : "Add Game"}
              </h2>
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-zinc-300">Game Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                    placeholder="Example: Mobile Legends"
                  />
                </div>

                <div className="mt-4">
                  <label className="text-sm font-semibold text-zinc-300 block mb-2">Game Image</label>
                  
                  {formData.image_url && (
                    <div className="mb-3 relative inline-block">
                      <img src={formData.image_url} alt="Preview" className="h-24 w-24 object-cover rounded-xl border border-white/10" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, image_url: ""})}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center shadow-lg"
                      >
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    </div>
                  )}

                  {!formData.image_url && (
                    <div className="rounded-xl border border-dashed border-white/20 p-4 bg-[#1a1a1a]">
                      <IKContext
                        publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
                        urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                        authenticator={authenticator}
                      >
                        <div className="flex flex-col items-center">
                          <IKUpload
                            ref={ikUploadRef}
                            fileName={`${formData.name || 'game'}-${Date.now()}.png`}
                            useUniqueFileName={true}
                            validateFile={(file) => file.size < 5000000}
                            folder={"/games"}
                            onError={(err) => {
                              console.error(err);
                              alert("Failed to upload image");
                              setUploading(false);
                            }}
                            onSuccess={(res) => {
                              setFormData({ ...formData, image_url: res.url });
                              setUploading(false);
                            }}
                            onUploadStart={() => setUploading(true)}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => ikUploadRef.current?.click()}
                            disabled={uploading}
                            className="bg-[#2a2a2a] hover:bg-[#333] transition px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                          >
                            {uploading ? "Uploading..." : "Select File"}
                          </button>
                          <span className="text-xs text-zinc-500 mt-2">Format: JPG, PNG. Max: 5MB</span>
                        </div>
                      </IKContext>
                    </div>
                  )}
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
      </div>
    </Sidebar>
  );
}
