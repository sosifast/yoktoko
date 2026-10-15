export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-start pt-2">
      {/* Top indeterminate animated progress bar */}
      <div className="w-full h-1 bg-transparent overflow-hidden fixed top-0 left-0">
        <div className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-[pulse_1s_ease-in-out_infinite] w-full" />
      </div>

      {/* Subtle floating spinner indicator */}
      <div className="mt-4 px-4 py-2 bg-black/70 backdrop-blur-md text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-2 border border-white/10 animate-fade-in">
        <i className="fa-solid fa-spinner fa-spin text-[#FECB2F]"></i>
        <span>Memuat halaman...</span>
      </div>
    </div>
  );
}
