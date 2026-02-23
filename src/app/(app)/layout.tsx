import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

  // Check subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at')
    .eq('user_id', user.id)
    .single()

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  // If no active subscription, show billing prompt
  if (!isActive) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="max-w-[440px] text-center">
          <div className="mb-8">
            <Link href="/" className="font-syne font-extrabold text-xl text-ink inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-pop rounded-full" />
              owed
            </Link>
          </div>
          <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-3">
            {subscription ? 'Your trial has ended' : 'Start your free trial'}
          </h1>
          <p className="text-muted text-[15px] mb-8 leading-relaxed">
            {subscription
              ? 'Subscribe to keep chasing. Your invoices are safe — we just paused the emails.'
              : '14 days free. Connect Xero and start getting paid.'}
          </p>
          <SubscribeButton />
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-line p-6 flex flex-col">
        <Link href="/dashboard" className="font-syne font-extrabold text-lg text-ink flex items-center gap-2 mb-10">
          <span className="w-2 h-2 bg-pop rounded-full" />
          owed
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          <Link
            href="/dashboard"
            className="px-3 py-2 rounded-lg text-[14px] font-medium text-ink hover:bg-cream transition-colors"
          >
            Invoices
          </Link>
          <Link
            href="/settings"
            className="px-3 py-2 rounded-lg text-[14px] font-medium text-muted hover:bg-cream hover:text-ink transition-colors"
          >
            Settings
          </Link>
        </nav>

        <div className="border-t border-line pt-4">
          <p className="text-sm font-medium text-ink truncate">
            {profile?.business_name || profile?.email}
          </p>
          {subscription?.status === 'trialing' && subscription?.trial_ends_at && (
            <p className="text-xs text-faint mt-1">
              Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-[240px] p-8">
        {children}
      </main>
    </div>
  )
}

// Client component for subscribe button
function SubscribeButton() {
  return (
    <form action="/api/stripe/checkout" method="POST">
      <button
        type="submit"
        className="px-8 py-3 bg-ink text-paper font-semibold text-[15px] rounded-lg hover:bg-ink-2 transition-colors"
      >
        Subscribe — £19/month
      </button>
    </form>
  )
}
