'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function SidebarNav() {
  const pathname = usePathname()
  const isInvoices = pathname === '/dashboard' || pathname.startsWith('/invoice')
  const isSettings = pathname === '/settings'

  return (
    <nav className="flex flex-col gap-1 flex-1">
      <Link href="/dashboard" className={`px-3 py-2 rounded-lg text-[14px] font-medium transition-colors ${isInvoices ? 'text-ink bg-cream' : 'text-muted hover:bg-cream hover:text-ink'}`}>Invoices</Link>
      <Link href="/settings" className={`px-3 py-2 rounded-lg text-[14px] font-medium transition-colors ${isSettings ? 'text-ink bg-cream' : 'text-muted hover:bg-cream hover:text-ink'}`}>Settings</Link>
    </nav>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const isInvoices = pathname === '/dashboard' || pathname.startsWith('/invoice')
  const isSettings = pathname === '/settings'

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-line flex z-50">
      <Link href="/dashboard" className={`flex-1 py-3 text-center text-xs font-semibold ${isInvoices ? 'text-ink' : 'text-muted'}`}>
        <svg className="mx-auto mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        Invoices
      </Link>
      <Link href="/settings" className={`flex-1 py-3 text-center text-xs font-semibold ${isSettings ? 'text-ink' : 'text-muted'}`}>
        <svg className="mx-auto mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Settings
      </Link>
    </nav>
  )
}
