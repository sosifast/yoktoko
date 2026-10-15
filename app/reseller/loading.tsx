export default function ResellerLoading() {
  return (
    <div className="w-full min-h-screen px-4 pt-4 pb-20 space-y-4 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-800"></div>
          <div className="space-y-1.5">
            <div className="w-28 h-4 rounded bg-gray-200 dark:bg-gray-800"></div>
            <div className="w-16 h-3 rounded bg-gray-200 dark:bg-gray-800"></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800"></div>
      </div>

      {/* Banner / Card Skeleton */}
      <div className="w-full h-36 rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700"></div>

      {/* Grid or Section Skeletons */}
      <div className="space-y-2 pt-2">
        <div className="w-32 h-4 rounded bg-gray-200 dark:bg-gray-800"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 rounded-xl bg-gray-200 dark:bg-gray-800"></div>
          <div className="h-28 rounded-xl bg-gray-200 dark:bg-gray-800"></div>
        </div>
      </div>

      {/* List items skeleton */}
      <div className="space-y-3 pt-3">
        <div className="w-40 h-4 rounded bg-gray-200 dark:bg-gray-800"></div>
        <div className="h-16 rounded-xl bg-gray-200 dark:bg-gray-800"></div>
        <div className="h-16 rounded-xl bg-gray-200 dark:bg-gray-800"></div>
        <div className="h-16 rounded-xl bg-gray-200 dark:bg-gray-800"></div>
      </div>
    </div>
  );
}
