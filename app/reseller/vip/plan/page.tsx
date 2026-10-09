import Link from "next/link";
import { db } from "@/lib/db";

export default async function VIPPlanPage() {
  const result = await db.query(`
    SELECT * FROM "reseller_plan"
    ORDER BY price ASC
  `);

  const plans = result.rows.map((plan, index) => {
    // Membuat paket termahal / durasi terlama menjadi popular secara otomatis
    const popular = index === result.rows.length - 1 && result.rows.length > 1;
    return {
      id: plan.id,
      paket: plan.paket,
      price: plan.price,
      durasi: plan.durasi,
      popular,
      features: popular 
        ? ["Akses harga termurah", "Prioritas order #1", "Support VIP", "Fitur eksklusif"]
        : ["Akses harga khusus", "Prioritas order", "Support 24/7"],
    };
  });

  return (
    <div className="p-4 flex flex-col gap-6 animate-fade-in pb-20">
      <div className="flex items-center gap-4 pt-2">
        <Link href="/reseller/dashboard" className="w-10 h-10 rounded-full bg-white dark:bg-[#222222] shadow-sm flex items-center justify-center text-gray-700 dark:text-zinc-300 border border-gray-100 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <div>
          <h2 className="text-gray-900 dark:text-white font-bold text-xl leading-tight">Pilih Paket VIP</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Upgrade membership Anda</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative rounded-3xl p-6 ${plan.popular ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-orange-900/20 scale-[1.02]' : 'bg-white dark:bg-[#222222] text-gray-800 dark:text-zinc-200 border border-gray-100 dark:border-[#333] shadow-md'} overflow-hidden transition-all duration-300`}>
            {plan.popular && (
              <>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm border border-white/20 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <i className="fa-solid fa-fire text-yellow-300"></i> POPULER
                </div>
              </>
            )}

            <h3 className={`text-xl font-black ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'} mb-1`}>{plan.paket}</h3>
            <p className={`text-sm ${plan.popular ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'} mb-4`}>Durasi {plan.durasi} Hari</p>
            
            <div className="flex items-end gap-1 mb-6">
              <span className={`text-sm font-bold ${plan.popular ? 'text-orange-200' : 'text-gray-400'} pb-1`}>Rp</span>
              <h1 className={`text-3xl font-extrabold tracking-tight ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {plan.price.toLocaleString("id-ID")}
              </h1>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.popular ? 'bg-white/20' : 'bg-[#FECB2F]/20 text-[#FECB2F]'}`}>
                    <i className="fa-solid fa-check text-[10px]"></i>
                  </div>
                  <span className={plan.popular ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}>{feature}</span>
                </li>
              ))}
            </ul>

            <Link href={`/reseller/vip/checkout?plan=${plan.id}`} className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all ${plan.popular ? 'bg-white text-orange-600 hover:bg-gray-50 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-[#FECB2F] text-[#222222] hover:bg-[#f1bf24] shadow-[0_0_15px_-3px_#FECB2F]'}`}>
              Pilih Paket
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
