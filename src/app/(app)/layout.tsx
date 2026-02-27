import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from './LogoutButton'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, email')
    .eq('id', user.id)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at')
    .eq('user_id', user.id)
    .single()

  // Paywall: redirect if no subscription, expired trial, or cancelled
  const isActive = subscription?.status === 'active'
  const isTrialing = subscription?.status === 'trialing' &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) > new Date()

  if (!isActive && !isTrialing) {
    redirect('/upgrade')
  }

  // Check for expired Xero connection
  const { data: connection } = await supabase
    .from('connections')
    .select('token_expired')
    .eq('user_id', user.id)
    .is('disconnected_at', null)
    .single()

  const needsReconnect = connection?.token_expired === true

  return (
    <div className="min-h-screen bg-paper">
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-line p-6 flex-col">
        <Link href="/dashboard" className="font-syne font-extrabold text-lg text-ink flex items-center gap-2 mb-10">
          <span className="w-2 h-2 bg-pop rounded-full" />
          owed
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          <Link href="/dashboard" className="px-3 py-2 rounded-lg text-[14px] font-medium text-ink hover:bg-cream transition-colors">Invoices</Link>
          <Link href="/settings" className="px-3 py-2 rounded-lg text-[14px] font-medium text-muted hover:bg-cream hover:text-ink transition-colors">Settings</Link>
        </nav>
        <div className="border-t border-line pt-4">
          <p className="text-sm font-medium text-ink truncate">{profile?.business_name || profile?.email}</p>
          {subscription?.status === 'trialing' && subscription?.trial_ends_at && (
            <p className="text-xs text-faint mt-1">Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
          )}
          <LogoutButton />
        </div>
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-line px-4 py-3 flex items-center justify-between z-50">
        <Link href="/dashboard" className="font-syne font-extrabold text-lg text-ink flex items-center gap-2">
          <span className="w-2 h-2 bg-pop rounded-full" />
          owed
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted truncate max-w-[120px]">{profile?.business_name || profile?.email}</p>
          <LogoutButton />
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-line flex z-50">
        <Link href="/dashboard" className="flex-1 py-3 text-center text-xs font-semibold text-ink">
          <svg className="mx-auto mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Invoices
        </Link>
        <Link href="/settings" className="flex-1 py-3 text-center text-xs font-semibold text-muted">
          <svg className="mx-auto mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </Link>
      </nav>

      <main className="md:ml-[240px] pt-14 pb-20 px-4 md:pt-0 md:pb-0 md:px-8 md:py-8">
        {needsReconnect && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-amber-800">Your Xero connection has expired. Reconnect to keep syncing invoices.</p>
            <a href="/api/xero/connect" className="text-sm font-semibold text-amber-900 hover:underline ml-4 shrink-0">Reconnect</a>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
