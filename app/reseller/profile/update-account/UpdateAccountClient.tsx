"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { updateResellerAccount, checkRobloxAccount } from "../actions";

interface UpdateAccountClientProps {
  initialUser: {
    id: string;
    username: string;
    email: string | null;
    profile_picture_url: string | null;
    roblox_username: string | null;
    tiktok_url: string | null;
  };
}

export default function UpdateAccountClient({ initialUser }: UpdateAccountClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    initialUser.profile_picture_url || null
  );
  const [profilePictureBase64, setProfilePictureBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialUser.profile_picture_url || null
  );

  const [robloxUsername, setRobloxUsername] = useState(initialUser.roblox_username || "");
  const [checkingRoblox, setCheckingRoblox] = useState(false);
  const [verifiedRoblox, setVerifiedRoblox] = useState<{
    id: number;
    name: string;
    displayName: string;
    avatarUrl: string;
  } | null>(null);

  const [tiktokUrl, setTiktokUrl] = useState(initialUser.tiktok_url || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);

  // Auto-verify if user already has a saved Roblox username
  useEffect(() => {
    if (initialUser.roblox_username) {
      checkRobloxAccount(initialUser.roblox_username).then((res) => {
        if (res.success && res.user) {
          setVerifiedRoblox(res.user);
        }
      });
    }
  }, [initialUser.roblox_username]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File yang diunggah harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfilePictureBase64(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePictureBase64(null);
    setProfilePictureUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Check Roblox user via API
  const handleCheckRoblox = async () => {
    if (checkingRoblox) return;
    const q = robloxUsername.trim();
    if (!q) {
      toast.error("Masukkan username Roblox terlebih dahulu.");
      return;
    }

    setCheckingRoblox(true);
    setVerifiedRoblox(null);

    try {
      const res = await checkRobloxAccount(q);
      if (!res.success || !res.user) {
        toast.error(res.error || "Akun Roblox tidak ditemukan. Periksa kembali username Anda.");
        return;
      }

      setVerifiedRoblox(res.user);
      setRobloxUsername(res.user.name); // Sesuaikan dengan format username resmi
      toast.success(`Akun Roblox terverifikasi: ${res.user.displayName}`);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghubungi server Roblox API.");
    } finally {
      setCheckingRoblox(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (newPassword) {
      if (!currentPassword) {
        toast.error("Masukkan kata sandi saat ini untuk mengubah kata sandi");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("Kata sandi baru minimal 6 karakter");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Konfirmasi kata sandi baru tidak cocok");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await updateResellerAccount({
        profilePictureBase64,
        profilePictureUrl,
        robloxUsername,
        tiktokUrl,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword ? newPassword : undefined,
        confirmPassword: newPassword ? confirmPassword : undefined,
      });

      if (!res.success) {
        toast.error(res.message);
        setLoading(false);
        return;
      }

      toast.success(res.message || "Profil berhasil diperbarui!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (res.profilePictureUrl) {
        setProfilePictureUrl(res.profilePictureUrl);
        setImagePreview(res.profilePictureUrl);
      }

      setTimeout(() => {
        router.push("/reseller/profile");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan sistem");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-5 animate-fade-in pb-12">
      <Toaster position="top-center" />

      {/* Top Navbar */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/reseller/profile"
          onClick={(e) => {
            e.preventDefault();
            router.push("/reseller/profile");
          }}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#222222] shadow-sm flex items-center justify-center text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-[#333] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition active:scale-95 cursor-pointer"
          title="Kembali ke Profil"
        >
          <i className="fa-solid fa-arrow-left text-sm"></i>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Update Akun</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Perbarui foto, akun Roblox (API check), TikTok & kata sandi
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Profile Picture Card */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800/80 text-gray-900 dark:text-white font-bold text-sm">
            <i className="fa-solid fa-image text-[#FECB2F]"></i>
            <span>Foto Profil</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center shadow-inner">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Foto Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500">
                    <i className="fa-solid fa-user text-2xl mb-0.5"></i>
                    <span className="text-[9px] font-medium">Kosong</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-3.5 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                >
                  <i className="fa-solid fa-camera text-xs text-[#FECB2F]"></i>
                  <span>{imagePreview ? "Ganti Foto" : "Unggah Foto"}</span>
                </button>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold transition active:scale-95"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-tight">
                Format: JPG, PNG, atau WEBP. Maksimal ukuran 5 MB.
              </p>
            </div>
          </div>
        </div>

        {/* Informasi Akun Dasar (Disabled) */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800/80 text-gray-900 dark:text-white font-bold text-sm">
            <i className="fa-solid fa-id-card text-[#FECB2F]"></i>
            <span>Informasi Akun (Permanen)</span>
          </div>

          {/* Username Field (Disabled) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Username
              </label>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1 font-medium">
                <i className="fa-solid fa-lock text-[9px]"></i> Tidak dapat diubah
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
                <i className="fa-solid fa-user text-xs"></i>
              </span>
              <input
                type="text"
                value={initialUser.username}
                disabled
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800/80 rounded-xl text-xs sm:text-sm text-gray-500 dark:text-zinc-400 cursor-not-allowed select-none"
                placeholder="Username"
              />
            </div>
          </div>

          {/* Email Field (Disabled) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Email
              </label>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1 font-medium">
                <i className="fa-solid fa-lock text-[9px]"></i> Tidak dapat diubah
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
                <i className="fa-solid fa-envelope text-xs"></i>
              </span>
              <input
                type="email"
                value={initialUser.email || ""}
                disabled
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800/80 rounded-xl text-xs sm:text-sm text-gray-500 dark:text-zinc-400 cursor-not-allowed select-none"
                placeholder="Email belum diatur"
              />
            </div>
          </div>
        </div>

        {/* Akun Game & Media Sosial (Roblox & TikTok) */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800/80 text-gray-900 dark:text-white font-bold text-sm">
            <i className="fa-solid fa-gamepad text-[#FECB2F]"></i>
            <span>Akun Game & Sosial</span>
          </div>

          {/* Akun Roblox with API Check */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Username Roblox
              </label>
              {verifiedRoblox && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <i className="fa-solid fa-circle-check text-[10px]"></i> Terverifikasi API
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
                  <i className="fa-solid fa-cube text-xs"></i>
                </span>
                <input
                  type="text"
                  value={robloxUsername}
                  onChange={(e) => {
                    setRobloxUsername(e.target.value);
                    if (verifiedRoblox && e.target.value.toLowerCase() !== verifiedRoblox.name.toLowerCase()) {
                      setVerifiedRoblox(null);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                  placeholder="Masukkan username atau ID Roblox"
                />
              </div>

              <button
                type="button"
                onClick={handleCheckRoblox}
                disabled={checkingRoblox || !robloxUsername.trim()}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#FECB2F] hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
              >
                {checkingRoblox ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                    <span>Cek...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-magnifying-glass text-xs"></i>
                    <span>Cek Akun</span>
                  </>
                )}
              </button>
            </div>

            {/* Verified Roblox User Preview Card */}
            {verifiedRoblox && (
              <div className="mt-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between animate-fade-in shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                    {verifiedRoblox.avatarUrl ? (
                      <img
                        src={verifiedRoblox.avatarUrl}
                        alt={verifiedRoblox.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="fa-solid fa-user text-emerald-500"></i>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 dark:text-white">
                        {verifiedRoblox.displayName}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-400">
                        (@{verifiedRoblox.name})
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-mono">
                      User ID: {verifiedRoblox.id}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <i className="fa-solid fa-check text-[10px]"></i> Valid
                </span>
              </div>
            )}

            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
              Gunakan tombol <strong>Cek Akun</strong> untuk memverifikasi akun Roblox melalui API resmi.
            </p>
          </div>

          {/* Akun TikTok */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
              Tautan Akun TikTok
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
                <i className="fa-brands fa-tiktok text-xs"></i>
              </span>
              <input
                type="text"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                placeholder="Contoh: https://www.tiktok.com/@username"
              />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
              Link atau URL profil TikTok aktif Anda.
            </p>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800/80 text-gray-900 dark:text-white font-bold text-sm">
            <i className="fa-solid fa-lock text-[#FECB2F]"></i>
            <span>Ubah Kata Sandi (Opsional)</span>
          </div>

          <p className="text-xs text-amber-600 dark:text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
            <i className="fa-solid fa-circle-info text-xs mt-0.5"></i>
            <span>Kosongkan formulir di bawah ini jika Anda tidak ingin mengubah kata sandi.</span>
          </p>

          {/* Current Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
              Kata Sandi Saat Ini
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
                <i className="fa-solid fa-key text-xs"></i>
              </span>
              <input
                type={showCurrentPass ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                placeholder="Masukkan kata sandi lama"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition"
              >
                <i className={`fa-solid ${showCurrentPass ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
                <i className="fa-solid fa-shield-halved text-xs"></i>
              </span>
              <input
                type={showNewPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition"
              >
                <i className={`fa-solid ${showNewPass ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
                <i className="fa-solid fa-check-double text-xs"></i>
              </span>
              <input
                type={showConfirmPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FECB2F] focus:ring-1 focus:ring-[#FECB2F] transition"
                placeholder="Ulangi kata sandi baru"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition"
              >
                <i className={`fa-solid ${showConfirmPass ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-3">
          <Link
            href="/reseller/profile"
            onClick={(e) => {
              e.preventDefault();
              router.push("/reseller/profile");
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-semibold text-xs text-center transition cursor-pointer"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk text-sm"></i>
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
