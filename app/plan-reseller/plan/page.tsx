"use client";

import Sidebar from "@/app/components/Sidebar";
import { useState, useEffect } from "react";
import { getResellerPlans, deleteResellerPlan } from "../actions";
import Link from "next/link";

export default function ResellerPlanPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await getResellerPlans();
      setPlans(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this plan?")) {
      await deleteResellerPlan(id);
      fetchPlans();
    }
  };

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Master Data Plan Reseller</h1>
            <p className="mt-2 text-zinc-400">Kelola paket reseller yang tersedia.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/plan-reseller/history"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-zinc-700"
            >
              <i className="fa-solid fa-clock-rotate-left"></i> Riwayat
            </Link>
            <Link
              href="/plan-reseller/plan/add"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FECB2F] px-4 py-2.5 text-sm font-bold text-black shadow-lg transition hover:bg-[#e5b62a]"
            >
              <i className="fa-solid fa-plus"></i> Add Plan
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#222222] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-[#333] bg-[#1a1a1a] text-zinc-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Paket</th>
                  <th className="px-6 py-4 font-semibold">Harga</th>
                  <th className="px-6 py-4 font-semibold">Durasi (Hari)</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">Loading data...</td>
                  </tr>
                ) : plans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">Belum ada paket.</td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-[#2a2a2a] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{plan.paket}</td>
                      <td className="px-6 py-4 text-[#FECB2F] font-bold">Rp {plan.price.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-zinc-300">{plan.durasi} Hari</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <Link href={`/plan-reseller/plan/edit/${plan.id}`} className="text-yellow-500 hover:underline font-semibold transition inline-flex items-center gap-1.5">
                          <i className="fa-solid fa-pen-to-square text-xs"></i> Edit
                        </Link>
                        <button onClick={() => handleDelete(plan.id)} className="text-red-500 hover:underline font-semibold transition inline-flex items-center gap-1.5">
                          <i className="fa-solid fa-trash-can text-xs"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
