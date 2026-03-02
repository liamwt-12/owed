export default function FoundLoading() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="max-w-[480px] w-full text-center">
        <div className="mb-10">
          <span className="font-syne font-extrabold text-xl text-ink inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-pop rounded-full animate-pulse" />
            owed
          </span>
        </div>
        <div className="inline-flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-pop" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-muted text-[15px]">Syncing your invoices from Xero...</p>
        </div>
      </div>
    </div>
  )
}
