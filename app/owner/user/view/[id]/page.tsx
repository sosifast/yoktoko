"use client";

import Sidebar from "@/app/components/Sidebar";
import { useState, useEffect } from "react";
import { getUserById } from "../../actions";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ViewUserPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (id) {
      getUserById(id).then(data => {
        setUser(data);
        setFetching(false);
      }).catch(err => {
        console.error(err);
        setFetching(false);
      });
    }
  }, [id]);

  return (
    <Sidebar>
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/owner/user" className="text-zinc-400 hover:text-white transition">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">View User Detail</h1>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#222222] shadow-lg overflow-hidden">
          {fetching ? (
            <div className="text-center text-zinc-500 py-12">Loading data...</div>
          ) : !user ? (
            <div className="text-center text-zinc-500 py-12">User not found</div>
          ) : (
            <div>
              {/* Header profile */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl text-white font-bold mb-4 backdrop-blur-sm border-4 border-white/30">
                  {user.username?.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                <span className="mt-2 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {user.level || 'Talent'}
                </span>
              </div>
              
              {/* Details */}
              <div className="p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/5">
                  <span className="text-zinc-500 font-medium mb-1 sm:mb-0">User ID</span>
                  <span className="text-white font-mono text-sm">{user.id}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/5">
                  <span className="text-zinc-500 font-medium mb-1 sm:mb-0">Username</span>
                  <span className="text-white font-medium">{user.username}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/5">
                  <span className="text-zinc-500 font-medium mb-1 sm:mb-0">Access Level</span>
                  <span className="text-white font-medium">{user.level || 'Talent'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/5">
                  <span className="text-zinc-500 font-medium mb-1 sm:mb-0">Balance</span>
                  <span className="text-white font-medium">Rp {user.balance || 0}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/5">
                  <span className="text-zinc-500 font-medium mb-1 sm:mb-0">Joined Date</span>
                  <span className="text-white font-medium">
                    {user.create_at ? new Date(user.create_at).toLocaleString('id-ID') : '-'}
                  </span>
                </div>
              </div>

              <div className="p-8 bg-[#1a1a1a] flex gap-3">
                <Link
                  href={`/user/edit/${user.id}`}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white shadow-lg transition hover:bg-blue-500"
                >
                  <i className="fa-solid fa-pen-to-square mr-2"></i> Edit
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
