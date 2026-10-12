"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    // Hapus cookies auth
    document.cookie = "session_token=; path=/; max-age=0";
    document.cookie = "user_level=; path=/; max-age=0";
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-all shadow-sm border border-red-500/20 active:scale-95"
        title="Logout"
        aria-label="Logout"
      >
        <i className="fa-solid fa-right-from-bracket text-base"></i>
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center mx-auto text-xl">
              <i className="fa-solid fa-right-from-bracket"></i>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Konfirmasi Logout</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Apakah Anda yakin ingin keluar dari akun ini?</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition shadow-lg shadow-red-500/30"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
