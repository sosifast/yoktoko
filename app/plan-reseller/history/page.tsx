"use client";

import Sidebar from "@/app/components/Sidebar";
import { useState, useEffect } from "react";
import { getHistoryReseller } from "../actions";
import Link from "next/link";

export default function HistoryResellerPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app, pass the user ID from auth session.
  const MOCK_USER_ID = ""; // Empty gets all history for admin view

  useEffect(() => {
    getHistoryReseller(MOCK_USER_ID).then(data => {
      setHistory(data);
      setLoading(false);
    });
  }, []);

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/plan-reseller/plan" className="text-zinc-400 hover:text-white transition">
                <i className="fa-solid fa-arrow-left text-xl"></i>
              </Link>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Riwayat Reseller</h1>
            </div>
            <p className="text-zinc-400">Pantau status pembelian keanggotaan reseller.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#222222] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-[#333] bg-[#1a1a1a] text-zinc-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Paket</th>
                  <th className="px-6 py-4 font-semibold">Harga</th>
                  <th className="px-6 py-4 font-semibold">Masa Aktif</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">Loading data...</td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">Belum ada riwayat pembelian.</td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-[#2a2a2a] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{item.username || item.id_user}</td>
                      <td className="px-6 py-4 text-white font-medium">
                        {item.paket}
                        <div className="text-xs text-zinc-500">{item.durasi} hari</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#FECB2F]">Rp {item.price.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <span className="text-zinc-500">Mulai:</span> {new Date(item.start_date).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-xs mt-1">
                          <span className="text-zinc-500">Berakhir:</span> {new Date(item.expired_date).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          item.status_pembayaran === 'Sukses' ? 'bg-green-500/10 text-green-400 ring-green-500/20' :
                          item.status_pembayaran === 'Batal' ? 'bg-red-500/10 text-red-400 ring-red-500/20' :
                          'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'
                        }`}>
                          {item.status_pembayaran}
                        </span>
                        {item.is_active === 1 && (
                          <span className="ml-2 inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.status_pembayaran === 'Pending' && (
                          <button className="text-blue-500 hover:underline font-semibold text-xs">
                            Upload Bukti
                          </button>
                        )}
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
