"use client";

import Sidebar from "@/app/components/Sidebar";
import { useState } from "react";
import { createUser } from "../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    level: "Talent"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUser(formData);
      router.push("/owner/user");
    } catch (err) {
      console.error(err);
      alert("Failed to create user");
    }
    setLoading(false);
  };

  return (
    <Sidebar>
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/owner/user" className="text-zinc-400 hover:text-white transition">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Add New User</h1>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#222222] shadow-lg p-6">
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
              <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-white outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                placeholder="Enter password"
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
                {loading ? "Saving..." : "Save User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Sidebar>
  );
}
