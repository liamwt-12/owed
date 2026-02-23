'use client'

import Link from 'next/link'

export default function ConnectPage() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="max-w-[480px] w-full">
        <div className="mb-10">
          <Link href="/" className="font-syne font-extrabold text-xl text-ink flex items-center gap-2">
            <span className="w-2 h-2 bg-pop rounded-full" />
            owed
          </Link>
        </div>

        <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-2">
          Connect your accounting software
        </h1>
        <p className="text-muted text-[15px] mb-10 leading-relaxed">
          We&apos;ll show you what we found. Read-only access. We never touch your invoices.
        </p>

        {/* Xero — active */}
        <a
          href="/api/xero/connect"
          className="flex items-center gap-4 p-5 bg-white border border-line rounded-xl hover:border-ink hover:shadow-md transition-all group mb-3"
        >
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-extrabold text-sm"
               style={{ background: '#1AB4D7' }}>
            X
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink">Xero</p>
            <p className="text-sm text-muted">Connect in 30 seconds</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-faint group-hover:text-ink transition-colors">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>

        {/* QuickBooks — coming soon */}
        <div className="flex items-center gap-4 p-5 bg-white border border-line rounded-xl opacity-50 mb-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-extrabold text-sm"
               style={{ background: '#2CA01C' }}>
            QB
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink">QuickBooks</p>
            <p className="text-sm text-faint">Coming soon</p>
          </div>
        </div>

        {/* Sage — coming soon */}
        <div className="flex items-center gap-4 p-5 bg-white border border-line rounded-xl opacity-50">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center font-extrabold text-sm"
               style={{ background: '#00D639', color: '#003D10' }}>
            S
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink">Sage Accounting</p>
            <p className="text-sm text-faint">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
