"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { processVIPCheckout } from "./actions";

interface CheckoutFormProps {
  planId: string;
  price: number;
}

export default function CheckoutForm({ planId, price }: CheckoutFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent double submission!

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await processVIPCheckout(planId);

      if (res.success && res.redirectTo) {
        // Langsung redirect ke halaman invoice
        router.push(res.redirectTo);
      } else {
        setErrorMsg(res.error || "Gagal memproses pembayaran");
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses pembayaran");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      {errorMsg && (
        <div className="mb-3.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center gap-2.5 text-xs text-red-400 font-medium">
          <i className="fa-solid fa-circle-exclamation text-sm shrink-0"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-6 text-white text-center shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <p className="text-sm text-gray-400 mb-2 relative z-10">
          Bayar sebelum <span className="font-bold text-white">23:59:00</span>
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="relative z-10 w-full py-4 rounded-xl bg-gradient-to-r from-[#FECB2F] to-amber-500 text-[#222222] font-black text-sm shadow-[0_0_20px_-5px_#FECB2F] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
              <span>Menyiapkan Pembayaran...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-lock text-xs"></i>
              <span>Bayar Sekarang (Rp {price.toLocaleString("id-ID")})</span>
            </>
          )}
        </button>

        {isLoading && (
          <p className="text-xs text-amber-400 mt-2.5 relative z-10 font-medium animate-pulse flex items-center justify-center gap-1.5">
            <i className="fa-solid fa-shield-halved text-[10px]"></i>
            <span>Menghubungkan ke gateway, mohon jangan tutup halaman...</span>
          </p>
        )}
      </div>
    </form>
  );
}
