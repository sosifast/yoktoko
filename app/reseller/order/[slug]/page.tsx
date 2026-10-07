import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function GameOrderPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Fetch Game by slug
  const gameRes = await db.query('SELECT * FROM "Game" WHERE slug = $1 LIMIT 1', [slug]);
  const game = gameRes.rows[0];

  if (!game) {
    notFound();
  }

  // Fetch Products for this game
  const productsRes = await db.query('SELECT * FROM "Produk" WHERE id_game = $1 ORDER BY harga_jual ASC', [game.id]);
  const products = productsRes.rows;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#121212] animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md z-10 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/reseller/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition">
            <i className="fa-solid fa-arrow-left text-lg"></i>
          </Link>
          <div className="flex items-center gap-3">
            {game.image_url ? (
              <img src={game.image_url} alt={game.name} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <i className="fa-solid fa-gamepad text-gray-500 text-xs"></i>
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{game.name}</h1>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="px-4 py-6">
        <h2 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Pilih Produk / Nominal</h2>
        {products.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-gray-800">
            <i className="fa-solid fa-box-open text-3xl text-gray-300 dark:text-gray-600 mb-2"></i>
            <p className="text-gray-500 text-sm">Belum ada produk untuk game ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((prod: any) => (
              <div key={prod.id} className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#FECB2F]/50 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <i className="fa-solid fa-circle-check text-[#FECB2F]"></i>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-2 pr-4">{prod.nama_produk}</h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Harga Reseller</div>
                <div className="font-extrabold text-[#FECB2F] text-lg">
                  Rp {prod.harga_jual.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
