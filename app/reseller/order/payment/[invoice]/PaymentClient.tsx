"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { uploadResellerPaymentProof } from "@/app/reseller/order/actions";

interface TransactionData {
  id: string;
  invoice: string;
  id_produk: string;
  id_game: string;
  price: number;
  status_pembayaran: string;
  bukti_status_pembayaran_url?: string | null;
  username_roblox?: string | null;
  status_transaksi: string;
  kode_server_join?: string | null;
  create_at: string;
  nama_produk?: string | null;
  game_name?: string | null;
}

interface PaymentClientProps {
  transactions: TransactionData[];
  primaryInvoice: string;
}

export default function PaymentClient({
  transactions: initialTransactions,
  primaryInvoice,
}: PaymentClientProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionData[]>(initialTransactions);
  const [buktiBayarBase64, setBuktiBayarBase64] = useState<string>("");
  const [buktiBayarPreview, setBuktiBayarPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Periksa apakah bukti sudah ada di salah satu transaksi
  const existingProof = transactions.find((t) => t.bukti_status_pembayaran_url)?.bukti_status_pembayaran_url || null;
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string | null>(existingProof);

  const totalNominal = transactions.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const allInvoices = transactions.map((t) => t.invoice);
  const usernameRoblox = transactions[0]?.username_roblox || "-";
  const gameName = transactions[0]?.game_name || "Game";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setBuktiBayarBase64(base64);
      setBuktiBayarPreview(base64);
      toast.success("Foto bukti transfer berhasil dipilih. Klik 'Kirim Pesanan' untuk menyelesaikan.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBukti = () => {
    setBuktiBayarBase64("");
    setBuktiBayarPreview("");
  };

  const handleKirimPesanan = async () => {
    if (!allInvoices.length) {
      toast.error("Nomor invoice tidak ditemukan.");
      return;
    }

    if (!buktiBayarBase64 && !uploadedProofUrl) {
      toast.error("Silakan pilih / upload foto bukti transfer terlebih dahulu.");
      return;
    }

    // Jika user mengunggah foto baru
    if (buktiBayarBase64) {
      setIsUploading(true);
      try {
        const res = await uploadResellerPaymentProof(allInvoices, buktiBayarBase64);
        if (!res.success) {
          toast.error(res.error || "Gagal mengunggah bukti pembayaran.");
          setIsUploading(false);
          return;
        }

        toast.success("Pesanan dan bukti pembayaran berhasil dikirim!");
        setUploadedProofUrl(res.url || null);
        setTransactions((prev) =>
          prev.map((t) => ({
            ...t,
            bukti_status_pembayaran_url: res.url,
            status_pembayaran: "Cek Pembayaran",
          }))
        );
        setBuktiBayarBase64("");
        setBuktiBayarPreview("");

        // Mengarahkan langsung ke halaman riwayat transaksi
        router.push("/reseller/transaksi");
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Terjadi kesalahan saat mengunggah bukti.");
        setIsUploading(false);
      }
    } else if (uploadedProofUrl) {
      // Jika sudah pernah terunggah sebelumnya, langsung arahkan ke riwayat transaksi
      toast.success("Mengarahkan ke riwayat transaksi...");
      router.push("/reseller/transaksi");
    }
  };

  const isPaidOrChecking =
    uploadedProofUrl ||
    transactions.some(
      (t) =>
        t.status_pembayaran.toLowerCase() === "cek pembayaran" ||
        t.status_pembayaran.toLowerCase() === "success" ||
        t.status_pembayaran.toLowerCase() === "sukses" ||
        t.status_pembayaran.toLowerCase() === "selesai"
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] animate-fade-in pb-20">
      {/* Top Navbar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md px-4 py-4 shadow-sm border-b border-gray-100 dark:border-white/5 flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/reseller/dashboard"
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </Link>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
              Pembayaran Pesanan
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {allInvoices.length > 1 ? `${allInvoices.length} Transaksi` : primaryInvoice}
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            isPaidOrChecking
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
              : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
          }`}
        >
          {isPaidOrChecking ? "Cek Pembayaran" : "Menunggu Bayar"}
        </span>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Rincian Tagihan */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-zinc-800 text-xs">
            <span className="text-gray-500 dark:text-zinc-400">Nomor Invoice</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-[#FECB2F]">
                {allInvoices.join(", ")}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(allInvoices.join(", "));
                  toast.success("Invoice disalin!");
                }}
                className="text-gray-400 hover:text-white"
                title="Salin Invoice"
              >
                <i className="fa-regular fa-copy"></i>
              </button>
            </div>
          </div>

          <div className="py-3 border-b border-gray-100 dark:border-zinc-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-zinc-400">Game & Akun Tujuan</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {gameName} ({usernameRoblox})
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-500 dark:text-zinc-400">Rincian Item</span>
              <div className="text-right">
                {transactions.map((t, idx) => (
                  <p key={idx} className="font-medium text-gray-800 dark:text-zinc-200">
                    {t.nama_produk || "Produk Game"} -{" "}
                    <span className="text-blue-500 font-semibold">
                      Rp {Number(t.price).toLocaleString("id-ID")}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-between items-center">
            <div>
              <span className="text-xs text-gray-500 dark:text-zinc-400">Total Tagihan</span>
              <p className="text-2xl font-black text-[#FECB2F]">
                Rp {totalNominal.toLocaleString("id-ID")}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(String(totalNominal));
                toast.success("Nominal disalin!");
              }}
              className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <i className="fa-regular fa-copy"></i>
              <span>Salin Nominal</span>
            </button>
          </div>
        </div>

        {/* QR Code QRIS Box dari public/qris/payment.jpeg */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col items-center text-center">
          <div className="mb-3">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-blue-200 dark:border-blue-900/50">
              Metode Pembayaran
            </span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">QRIS Standar Nasional</h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Scan melalui BCA, Mandiri, BRI, BNI, GoPay, Dana, OVO, ShopeePay
            </p>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-200 dark:border-zinc-700 max-w-[280px] w-full">
            <img
              src="/qris/payment.jpeg"
              alt="QRIS YOK Entertaiment"
              className="w-full h-auto object-contain rounded-xl"
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <a
              href="/qris/payment.jpeg"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-200 flex items-center gap-1.5 transition"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              Buka Gambar Penuh
            </a>
            <a
              href="/qris/payment.jpeg"
              download="qris-yok-entertaiment.jpeg"
              className="px-3.5 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 transition border border-blue-500/20"
            >
              <i className="fa-solid fa-download text-[10px]"></i>
              Unduh QRIS
            </a>
          </div>
        </div>

        {/* Form Upload Bukti Pembayaran */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#FECB2F]/20 text-[#FECB2F] flex items-center justify-center">
              <i className="fa-solid fa-receipt text-sm"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Upload Bukti Transfer
              </h3>
            </div>
          </div>

          {uploadedProofUrl ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                <i className="fa-solid fa-circle-check text-base"></i>
                <span>Bukti Pembayaran Berhasil Diunggah!</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Terima kasih! Bukti transfer Anda telah disimpan ke sistem. Status transaksi Anda kini dalam tahap <strong className="text-white">Cek Pembayaran</strong>. Admin kami akan segera memproses transaksi pesanan Anda.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-emerald-500/20">
                <button
                  onClick={() => setPreviewImageModal(uploadedProofUrl)}
                  className="text-blue-400 hover:underline font-semibold flex items-center gap-1.5 text-xs"
                >
                  <i className="fa-solid fa-image"></i>
                  <span>Lihat Foto Bukti Terupload</span>
                </button>
                <a
                  href={uploadedProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-white text-[11px] flex items-center gap-1"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                  Buka Gambar
                </a>
              </div>

              <button
                type="button"
                onClick={() => router.push("/reseller/transaksi")}
                className="w-full bg-[#FECB2F] hover:bg-[#e5b62a] text-[#222] py-3.5 rounded-xl font-black text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
              >
                <i className="fa-solid fa-paper-plane"></i>
                <span>Kirim Pesanan</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {buktiBayarPreview ? (
                <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#161616] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={buktiBayarPreview}
                      alt="Preview Bukti"
                      className="w-16 h-16 object-cover rounded-xl border border-gray-300 dark:border-zinc-700 shadow-sm shrink-0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveBukti}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center gap-1.5 transition text-xs font-semibold"
                    title="Hapus foto"
                  >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                    <span>Hapus / Ganti</span>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-[#FECB2F] rounded-2xl p-6 cursor-pointer bg-gray-50 dark:bg-[#161616] transition group">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-cloud-arrow-up text-xl text-gray-400 dark:text-zinc-500 group-hover:text-[#FECB2F] transition-colors"></i>
                  </div>
                  <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                    Pilih / Foto Bukti Transfer
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1">
                    Format JPG, PNG, WEBP (maksimal 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              {buktiBayarPreview && (
                <button
                  type="button"
                  onClick={handleKirimPesanan}
                  disabled={isUploading}
                  className="w-full bg-[#FECB2F] hover:bg-[#e5b62a] text-[#222] py-4 rounded-2xl font-black text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isUploading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Menyimpan & Mengirim Pesanan...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i>
                      <span>Kirim Pesanan</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Preview Foto Bukti Terupload */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="bg-[#1e1e1e] rounded-2xl p-4 max-w-lg w-full border border-white/10 shadow-2xl relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-receipt text-blue-400"></i> Bukti Transfer
              </span>
              <button
                onClick={() => setPreviewImageModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full max-h-[70vh] flex items-center justify-center bg-black/40 rounded-xl overflow-hidden p-2">
              <img
                src={previewImageModal}
                alt="Bukti Transfer"
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="w-full mt-3 flex justify-between items-center">
              <a
                href={previewImageModal}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Buka di tab baru
              </a>
              <button
                onClick={() => setPreviewImageModal(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
