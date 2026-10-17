"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/app/actions";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const user = await loginUser(username, password);
      const level = (user.level || "").toLowerCase();

      if (level !== "owner") {
        setErrorMsg("Akses ditolak: Hanya Owner / Administrator yang diizinkan masuk.");
        setIsLoading(false);
        return;
      }

      router.push("/owner/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Username atau kata sandi tidak valid");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 font-sans selection:bg-[#FECB2F] selection:text-black">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#121217] p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Top Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-amber-500/20 via-[#FECB2F]/10 to-transparent blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center relative z-10 mb-8 pt-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#FECB2F] text-zinc-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/20 mb-3">
            Y
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Login Owner</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Masuk ke panel kontrol manajemen YokEntertaiment
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 rounded-xl bg-red-950/40 border border-red-500/40 p-3.5 text-xs text-red-300 flex items-center gap-2.5 relative z-10 animate-shake">
            <span className="text-base shrink-0">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username owner"
              autoComplete="username"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                autoComplete="current-password"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 pr-11 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-bold transition"
              >
                {showPassword ? "SEMBUNYI" : "LIHAT"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-[#FECB2F] to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk ke Panel Owner →</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-xs text-zinc-500">
          Sistem Terproteksi YokEntertaiment
        </div>
      </div>
    </div>
  );
}
