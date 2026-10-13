"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfileLogoutButton() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    document.cookie = "session_token=; path=/; max-age=0";
    document.cookie = "user_level=; path=/; max-age=0";
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="w-full py-3 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98]"
      >
        <i className="fa-solid fa-right-from-bracket text-sm"></i>
        <span>Keluar dari Akun</span>
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Apakah Anda yakin ingin keluar dari akun reseller ini?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2 px-3 rounded-xl bg-red-500 text-white font-semibold text-xs hover:bg-red-600 transition shadow-md shadow-red-500/20"
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
