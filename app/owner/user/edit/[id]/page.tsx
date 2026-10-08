"use client";

import Sidebar from "@/app/components/Sidebar";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getUserById, updateUser } from "../../actions";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    level: "Talent",
    balance: 0
  });

  useEffect(() => {
    if (id) {
      getUserById(id).then(user => {
        if (user) {
          setFormData({
            username: user.username,
            email: user.email || "",
            level: user.level || 'Talent',
            balance: user.balance || 0
          });
        }
        setFetching(false);
      }).catch(err => {
        console.error(err);
        setFetching(false);
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(id, formData);
      toast.success("User berhasil diperbarui!");
      setTimeout(() => {
        router.push("/owner/user");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update user");
      setLoading(false);
    }
  };

  return (
    <Sidebar>
      <Toaster position="top-right" />
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/owner/user" className="text-zinc-400 hover:text-white transition">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Edit User</h1>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#222222] shadow-lg p-6">
          {fetching ? (
            <div className="text-center text-zinc-500 py-8">Loading data...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-white outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-white outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                  placeholder="Enter email (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-white outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                >
                  <option value="Talent">Talent</option>
                  <option value="Reseller">Reseller</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Balance</label>
                <input
                  type="number"
                  required
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-white outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                  placeholder="Enter balance"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Link
                  href="/owner/user"
                  className="flex-1 rounded-xl bg-zinc-800 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-zinc-700"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[#FECB2F] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#e5b62a] disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
