"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/app/actions";
import { Analytics } from "@vercel/analytics/next";

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
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Username atau kata sandi tidak valid");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex justify-center font-sans selection:bg-[#FECB2F] selection:text-black">
      <div className="w-full max-w-md min-h-screen flex flex-col justify-between px-6 py-8 sm:border-x sm:border-zinc-800/60 bg-[#09090b]">
        
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95"
              aria-label="Kembali"
            >
              <i className="fa-solid fa-arrow-left text-sm"></i>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FECB2F] flex items-center justify-center font-black text-zinc-950 text-xs">
                Y
              </div>
              <span className="font-bold text-sm tracking-tight text-white">YokEntertaiment</span>
            </div>
            <div className="w-10"></div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Masuk
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Masukkan akun Anda untuk melanjutkan
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5">
              <i className="fa-solid fa-circle-exclamation text-red-400 text-sm shrink-0"></i>
              <p className="text-xs text-red-300 font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                placeholder="Masukkan username"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5" htmlFor="password">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-4 pr-11 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                  aria-label="Lihat password"
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-6 rounded-xl bg-[#FECB2F] hover:bg-[#e5b729] text-zinc-950 font-bold text-sm transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
                  <span>Memproses...</span>
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>

        {/* Bottom Link */}
        <div className="pt-6 pb-2 text-center text-sm text-zinc-400">
          Belum punya akun?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-[#FECB2F] hover:underline"
          >
            Daftar sekarang
          </Link>
        </div>

        <Analytics />
      </div>
    </div>
  );
}
