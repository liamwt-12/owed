export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-32 bg-line rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-line/60 rounded animate-pulse" />
      </div>

      {/* Desktop skeleton */}
      <div className="hidden md:block bg-white border border-line rounded-2xl overflow-hidden">
        <div className="border-b border-line px-5 py-3 flex gap-8">
          {[80, 60, 50, 70, 50, 50].map((w, i) => (
            <div key={i} className="h-3 bg-line/60 rounded animate-pulse" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-line last:border-0 px-5 py-4 flex items-center gap-8">
            <div className="h-4 w-28 bg-line rounded animate-pulse" />
            <div className="h-4 w-20 bg-line/60 rounded animate-pulse" />
            <div className="h-4 w-16 bg-line rounded animate-pulse ml-auto" />
            <div className="h-4 w-20 bg-line/60 rounded animate-pulse" />
            <div className="h-4 w-8 bg-line rounded animate-pulse" />
            <div className="h-6 w-16 bg-line/60 rounded-full animate-pulse" />
          </div>
        ))}
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-line rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="h-4 w-32 bg-line rounded animate-pulse mb-1.5" />
                <div className="h-3 w-20 bg-line/60 rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-line/60 rounded-full animate-pulse" />
            </div>
            <div className="flex items-end justify-between">
              <div className="h-5 w-24 bg-line rounded animate-pulse" />
              <div className="h-5 w-10 bg-line rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
