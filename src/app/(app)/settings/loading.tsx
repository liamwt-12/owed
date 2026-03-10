export default function SettingsLoading() {
  return (
    <div className="max-w-[560px]">
      <div className="animate-pulse">
        <div className="h-8 bg-line rounded w-32 mb-6" />
        <div className="bg-white border border-line rounded-2xl p-6 mb-4">
          <div className="h-4 bg-line rounded w-40 mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-line rounded" />
            <div className="h-10 bg-line rounded" />
          </div>
        </div>
        <div className="bg-white border border-line rounded-2xl p-6 mb-4">
          <div className="h-4 bg-line rounded w-48 mb-4" />
          <div className="h-10 bg-line rounded" />
        </div>
      </div>
    </div>
  )
}
