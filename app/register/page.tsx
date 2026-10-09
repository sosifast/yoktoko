"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerReseller } from "../actions";

export default function ResellerRegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await registerReseller(username, email, password);
      setSuccessMsg("Registration successful! Redirecting to login...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#222222] font-sans">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/5 bg-[#2a2a2a] p-10 shadow-2xl transition-all">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FECB2F] shadow-[0_10px_20px_-10px_#FECB2F]">
            <span className="text-3xl font-black text-[#222222]">Y</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Reseller Registration</h1>
          <p className="mt-2 text-sm text-zinc-400">Join us and start earning today</p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-center">
            <p className="text-sm font-semibold text-red-400">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 rounded-xl bg-green-500/10 p-4 border border-green-500/20 text-center">
            <p className="text-sm font-semibold text-green-400">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
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
              placeholder="Choose a username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-white/5 bg-[#222222] px-4 py-3.5 text-white placeholder-zinc-600 shadow-inner outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
              placeholder="Enter your email"
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

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full rounded-xl border border-white/5 bg-[#222222] px-4 py-3.5 text-white placeholder-zinc-600 shadow-inner outline-none transition focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative mt-6 flex w-full justify-center overflow-hidden rounded-xl bg-[#FECB2F] px-4 py-3.5 text-sm font-bold text-[#222222] shadow-[0_0_20px_-5px_#FECB2F] transition-all hover:bg-[#f1bf24] hover:shadow-[0_0_25px_-3px_#FECB2F] focus:outline-none focus:ring-2 focus:ring-[#FECB2F] focus:ring-offset-2 focus:ring-offset-[#222222] disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin text-[#222222]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </span>
            ) : (
              "Sign Up as Reseller"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <a href="/" className="font-semibold text-[#FECB2F] hover:underline">
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
