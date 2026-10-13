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

      const level = user.level.toLowerCase();
      document.cookie = `session_token=${user.id}; path=/; max-age=86400`; // Berlaku 1 hari
      document.cookie = `user_level=${level}; path=/; max-age=86400`;

      if (level === "owner") {
        router.push("/owner/dashboard");
      } else if (level === "reseller") {
        router.push("/reseller/dashboard");
      } else {
        router.push("/dashboard"); // Fallback
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a] p-4 font-sans text-gray-100">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/5 bg-[#242424] p-8 sm:p-10 shadow-2xl transition-all">
        {/* Logo & Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FECB2F] shadow-[0_10px_25px_-8px_#FECB2F]">
            <span className="text-3xl font-black text-[#1a1a1a]">Y</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            YokEntertaiment
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Masuk ke akun Anda untuk melanjutkan
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 flex rounded-xl bg-zinc-900/80 p-1 border border-zinc-800">
          <button
            type="button"
            className="flex-1 rounded-lg py-2 text-xs font-bold transition-all bg-[#FECB2F] text-zinc-950 shadow-sm"
          >
            Masuk
          </button>
          <Link
            href="/auth/register"
            className="flex-1 rounded-lg py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-all text-center"
          >
            Daftar Reseller
          </Link>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-3.5 border border-red-500/20 text-center flex items-center justify-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-red-400 text-sm"></i>
            <p className="text-xs font-semibold text-red-400">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <i className="fa-solid fa-user text-xs"></i>
              </span>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-xl border border-white/5 bg-[#1c1c1c] pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 shadow-inner outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                placeholder="Masukkan username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <i className="fa-solid fa-lock text-xs"></i>
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-white/5 bg-[#1c1c1c] pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-600 shadow-inner outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition"
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative mt-6 flex w-full justify-center overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-[#FECB2F] py-3.5 text-sm font-bold text-zinc-950 shadow-[0_0_20px_-5px_#FECB2F] transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                <span>Memproses...</span>
              </span>
            ) : (
              "Masuk Sekarang"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-zinc-400">
          Belum punya akun?{" "}
          <Link href="/auth/register" className="font-bold text-[#FECB2F] hover:underline">
            Daftar sebagai Reseller
          </Link>
        </div>
      </div>
    </div>
  );
}
