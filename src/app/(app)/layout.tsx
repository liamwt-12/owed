import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from './LogoutButton'
import { SidebarNav, MobileNav } from './NavLinks'

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
    .select('business_name, email, beta_user, partner, referred_by')
    .eq('id', user.id)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at')
    .eq('user_id', user.id)
    .single()

  // Allow access if: active subscription, valid trial, OR new user with no subscription yet (grace period)
  const isActive = subscription?.status === 'active'
  const isTrialing = subscription?.status === 'trialing' &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) > new Date()

  // Grace period: if no subscription exists, check profile creation date
  // Allow 14 days from signup (30 days if referred by a partner)
  let isInGracePeriod = false
  if (!subscription) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('created_at, referred_by')
      .eq('id', user.id)
      .single()

    if (profileData?.created_at) {
      const trialDays = profileData.referred_by ? 30 : 14
      const daysSinceSignup = Math.floor(
        (Date.now() - new Date(profileData.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      isInGracePeriod = daysSinceSignup <= trialDays
    }
  }

  const isBetaUser = profile?.beta_user === true
  const isPartner = profile?.partner === true

  if (!isActive && !isTrialing && !isInGracePeriod && !isBetaUser && !isPartner) {
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
        <SidebarNav />
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

      <MobileNav />

      <main className="md:ml-[240px] pt-14 pb-20 px-4 md:pt-0 md:pb-0 md:px-8 md:py-8">
        {needsReconnect && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-amber-800">Your Xero connection has expired. Reconnect to keep syncing invoices.</p>
            <a href="/api/xero/connect" className="text-sm font-semibold text-amber-900 hover:underline ml-4 shrink-0">Reconnect</a>
          </div>
        )}
        {children}
      </main>

      <footer className="md:ml-[240px] px-4 md:px-8 py-4 flex items-center justify-center gap-4 text-xs text-muted">
        <a href="/privacy" className="hover:text-ink transition-colors">Privacy</a>
        <span className="text-faint">&middot;</span>
        <a href="/terms" className="hover:text-ink transition-colors">Terms</a>
        <span className="text-faint">&middot;</span>
        <a href="/support" className="hover:text-ink transition-colors">Support</a>
      </footer>
    </div>
  )
}
