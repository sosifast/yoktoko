import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { markPlanPaymentSuccess } from "@/lib/payment-service";

export default async function PaymentPage(props: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const searchParams = await props.searchParams;
  let reference = searchParams.ref;

  if (!reference) {
    return notFound();
  }

  // Jika parameter ref adalah ID history (UUID), periksa atau generate transaksi PG
  if (reference.length > 20 && reference.includes("-")) {
    const historyCheck = await db.query(
      `SELECT h.*, p.paket 
       FROM "history_reseller_plan" h
       LEFT JOIN "reseller_plan" p ON h.id_reseller_plan = p.id
       WHERE h.id = $1`,
      [reference]
    );

    if (historyCheck.rows.length > 0) {
      const hRow = historyCheck.rows[0];
      if (hRow.bukti_bayar_url) {
        reference = hRow.bukti_bayar_url;
      } else {
        // Belum memiliki invoice di Payment Gateway, buat sekarang
        const isSandbox = process.env.PGKU_MODE === "SANDBOX";
        const baseUrl = isSandbox ? process.env.PGKU_SANDBOX_URL : process.env.PGKU_PRODUCTION_URL;
        const createEndpoint = isSandbox ? "sandbox/payment/create" : "production/payment/create";
        const origin = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        try {
          const createRes = await fetch(`${baseUrl}/${createEndpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              api_key: process.env.PGKU_API_KEY!,
              kode_api: process.env.PGKU_KODE_API!,
            },
            body: JSON.stringify({
              method: "QRIS",
              amount: hRow.price,
              name: `VIP Membership - ${hRow.paket || "Plan"}`,
              merchant_ref: hRow.id,
              callback_url: `${origin}/api/payment/webhook`,
              return_url: `${origin}/reseller/vip/history`,
            }),
          });
          const createData = await createRes.json();
          if (createData.success && createData.data?.reference) {
            reference = createData.data.reference;
            await db.query(
              `UPDATE "history_reseller_plan" SET bukti_bayar_url = $1 WHERE id = $2`,
              [reference, hRow.id]
            );
          }
        } catch (genErr) {
          console.error("Gagal auto-create payment di PG:", genErr);
        }
      }
    }
  }

  const isSandbox = process.env.PGKU_MODE === "SANDBOX";
  const baseUrl = isSandbox ? process.env.PGKU_SANDBOX_URL : process.env.PGKU_PRODUCTION_URL;
  const endpoint = isSandbox ? "sandbox/payment/detail" : "production/payment/detail";

  const res = await fetch(`${baseUrl}/${endpoint}?reference=${reference}`, {
    method: "GET",
    headers: {
      "api_key": process.env.PGKU_API_KEY!,
      "kode_api": process.env.PGKU_KODE_API!,
    },
    cache: "no-store"
  });

  const responseData = await res.json();
  
  if (!responseData.success) {
    return (
      <div className="p-4 flex flex-col gap-4 text-center mt-10">
        <h2 className="font-bold text-xl text-red-500">Gagal Memuat Pembayaran</h2>
        <p className="text-gray-500">{responseData.message || "Transaksi tidak ditemukan."}</p>
        <Link href="/reseller/dashboard" className="px-4 py-2 bg-[#FECB2F] text-black font-bold rounded-lg mt-4 inline-block">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const data = responseData.data;

  // Auto-sync status: jika PG menyatakan status sudah Success / PAID, update database lokal
  const isPaid = data.status === "Success" || data.status === "PAID" || data.status === "SETTLED" || data.status === "COMPLETED";
  if (isPaid) {
    const targetRef = data.merchant_ref || (searchParams.ref?.includes("-") ? searchParams.ref : null);
    if (targetRef) {
      await markPlanPaymentSuccess(targetRef, data.reference);
    } else {
      // Cari record history dengan bukti_bayar_url = reference
      const findHistory = await db.query(
        `SELECT id FROM "history_reseller_plan" WHERE bukti_bayar_url = $1`,
        [data.reference]
      );
      if (findHistory.rows.length > 0) {
        await markPlanPaymentSuccess(findHistory.rows[0].id, data.reference);
      }
    }
  }

  return (
    <div className="p-4 flex flex-col gap-6 animate-fade-in pb-20">
      <div className="flex items-center gap-4 pt-2">
        <Link href="/reseller/dashboard" className="w-10 h-10 rounded-full bg-white dark:bg-[#222222] shadow-sm flex items-center justify-center text-gray-700 dark:text-zinc-300 border border-gray-100 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <div>
          <h2 className="text-gray-900 dark:text-white font-bold text-xl leading-tight">Detail Pembayaran</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Selesaikan instruksi berikut</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#222222] rounded-3xl p-5 border border-gray-100 dark:border-[#333] shadow-md relative overflow-hidden text-center">
        <h3 className="text-sm text-gray-500 mb-1">Total Tagihan</h3>
        <h1 className="text-3xl font-black text-[#FECB2F] mb-4">
          Rp {data.amount?.toLocaleString("id-ID") || 0}
        </h1>
        
        <div className="inline-block px-4 py-1 rounded-full bg-gray-100 dark:bg-[#333] text-sm font-semibold mb-6">
          Status: <span className={data.status === 'UNPAID' ? 'text-orange-500' : 'text-green-500'}>{data.status}</span>
        </div>

        {data.payment?.qr_url ? (
          <div className="flex justify-center mb-6">
            <img src={data.payment.qr_url} alt="QRIS" className="w-48 h-48 rounded-xl border border-gray-200" />
          </div>
        ) : data.payment?.va_number ? (
          <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-4 mb-6 border border-gray-100 dark:border-[#333]">
            <p className="text-xs text-gray-500 mb-1">Virtual Account / Kode Bayar</p>
            <p className="font-mono text-xl font-bold tracking-widest">{data.payment.va_number}</p>
          </div>
        ) : null}

        <div className="text-left text-sm text-gray-600 dark:text-gray-400 space-y-2 mt-4 bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-xl">
          <div className="flex justify-between">
            <span>Referensi</span>
            <span className="font-semibold">{data.reference}</span>
          </div>
          <div className="flex justify-between">
            <span>Pesanan</span>
            <span className="font-semibold">{data.name || "-"}</span>
          </div>
        </div>
      </div>
      
      {isPaid ? (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center text-green-500 text-sm font-bold flex items-center justify-center gap-2">
            <i className="fa-solid fa-circle-check text-lg"></i>
            Pembayaran Berhasil! Membership VIP Anda Telah Aktif.
          </div>
          <Link href="/reseller/vip/history" className="w-full py-4 rounded-xl bg-[#FECB2F] text-black font-bold text-sm hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
            <i className="fa-solid fa-crown"></i> Lihat Riwayat Membership
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Link href={`/reseller/payment?ref=${reference}`} className="w-full py-3.5 rounded-xl bg-gray-100 dark:bg-[#333] text-gray-800 dark:text-zinc-200 font-semibold text-xs hover:bg-gray-200 dark:hover:bg-[#444] transition-colors flex items-center justify-center gap-2">
            <i className="fa-solid fa-rotate-right"></i> Refresh / Cek Status Pembayaran
          </Link>
          <Link href="/reseller/vip/history" className="w-full py-3.5 rounded-xl border border-gray-200 dark:border-[#444] text-gray-800 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-[#333] transition-colors flex items-center justify-center gap-2">
            Kembali ke Riwayat
          </Link>
        </div>
      )}
    </div>
  );
}
