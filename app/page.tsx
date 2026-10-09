"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="flex min-h-screen items-center justify-center bg-[#222222] font-sans">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/5 bg-[#2a2a2a] p-10 shadow-2xl transition-all">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FECB2F] shadow-[0_10px_20px_-10px_#FECB2F]">
            <span className="text-3xl font-black text-[#222222]">Y</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">YokEntertaiment</h1>
          <p className="mt-2 text-sm text-zinc-400">Please sign in to continue</p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-center">
            <p className="text-sm font-semibold text-red-400">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full rounded-xl border border-white/5 bg-[#222222] px-4 py-3.5 text-white placeholder-zinc-600 shadow-inner outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-white/5 bg-[#222222] px-4 py-3.5 text-white placeholder-zinc-600 shadow-inner outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative mt-8 flex w-full justify-center overflow-hidden rounded-xl bg-[#FECB2F] px-4 py-3.5 text-sm font-bold text-[#222222] shadow-[0_0_20px_-5px_#FECB2F] transition-all hover:bg-[#f1bf24] hover:shadow-[0_0_25px_-3px_#FECB2F] focus:outline-none focus:ring-2 focus:ring-[#FECB2F] focus:ring-offset-2 focus:ring-offset-[#222222] disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin text-[#222222]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
