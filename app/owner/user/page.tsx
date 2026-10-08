"use client";

import Sidebar from "@/app/components/Sidebar";
import Pagination from "@/app/components/Pagination";
import { useState, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getUsers, deleteUser } from "./actions";

export default function UserPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: "" });

  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(deleteModal.id);
      toast.success("User berhasil dihapus!");
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menghapus user.");
    } finally {
      setDeleteModal({ isOpen: false, id: "" });
    }
  };

  // Filtered & Paginated items
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase().trim();
    return users.filter(
      (user) =>
        user.username?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  return (
    <Sidebar>
      <Toaster position="top-right" />
      <div className="p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Manage Users</h1>
          </div>
          <a
            href="/owner/user/add"
            className="inline-flex items-center gap-2 rounded-xl bg-[#FECB2F] px-4 py-2.5 text-sm font-bold text-black shadow-lg transition hover:bg-[#e5b62a]"
          >
            <i className="fa-solid fa-plus"></i> Add User
          </a>
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
              placeholder="Search user (username)..."
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
            Total User: <span className="font-bold text-white">{filteredUsers.length}</span>
            {searchQuery && ` (dari ${users.length})`}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#222222] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-[#333] bg-[#1a1a1a] text-zinc-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Username</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Level</th>
                  <th className="px-6 py-4 font-semibold">Balance</th>
                  <th className="px-6 py-4 font-semibold">Tanggal Dibuat</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">Loading data...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">
                      {searchQuery
                        ? `Tidak ada user yang cocok dengan "${searchQuery}".`
                        : "Belum ada user."}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#2a2a2a] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{user.username}</td>
                      <td className="px-6 py-4 text-zinc-300">{user.email || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          user.level === 'Owner' ? 'bg-purple-500/10 text-purple-400 ring-purple-500/20' :
                          user.level === 'Admin' ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20' :
                          user.level === 'Reseller' ? 'bg-orange-500/10 text-orange-400 ring-orange-500/20' :
                          'bg-green-500/10 text-green-400 ring-green-500/20'
                        }`}>
                          {user.level || 'Talent'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">Rp {user.balance?.toLocaleString('id-ID') || '0'}</td>
                      <td className="px-6 py-4">{new Date(user.create_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <a href={`/owner/user/view/${user.id}`} className="text-blue-500 hover:underline font-semibold transition inline-flex items-center gap-1.5">
                          <i className="fa-solid fa-eye text-xs"></i> View
                        </a>
                        <a href={`/owner/user/edit/${user.id}`} className="text-yellow-500 hover:underline font-semibold transition inline-flex items-center gap-1.5">
                          <i className="fa-solid fa-pen-to-square text-xs"></i> Edit
                        </a>
                        <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:underline font-semibold transition inline-flex items-center gap-1.5">
                          <i className="fa-solid fa-trash-can text-xs"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredUsers.length > 0 && (
            <Pagination
              currentPage={safeCurrentPage}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#222222] p-6 shadow-2xl">
              <div className="flex justify-center mb-4 text-red-500">
                <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Hapus User?</h3>
              <p className="text-zinc-400 text-center text-sm mb-6">
                Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus user ini?
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
      </div>
    </Sidebar>
  );
}
