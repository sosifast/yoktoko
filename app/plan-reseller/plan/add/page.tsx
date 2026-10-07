"use client";

import Sidebar from "@/app/components/Sidebar";
import { useState } from "react";
import { createResellerPlan } from "../../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paket: "",
    price: 0,
    durasi: 30
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createResellerPlan(formData);
      router.push("/plan-reseller/plan");
    } catch (err) {
      console.error(err);
      alert("Failed to create plan");
    }
    setLoading(false);
  };

  return (
    <Sidebar>
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/plan-reseller/plan" className="text-zinc-400 hover:text-white transition">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Add Reseller Plan</h1>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#222222] shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Nama Paket</label>
              <input
                type="text"
                required
                value={formData.paket}
                onChange={(e) => setFormData({ ...formData, paket: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-white outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                placeholder="Ex: VIP Reseller"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Harga (Rp)</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-white outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Durasi (Hari)</label>
              <input
                type="number"
                required
                value={formData.durasi}
                onChange={(e) => setFormData({ ...formData, durasi: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-white outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                placeholder="30"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Link
                href="/plan-reseller/plan"
                className="flex-1 rounded-xl bg-zinc-800 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-zinc-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-[#FECB2F] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#e5b62a] disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Plan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Sidebar>
  );
}
