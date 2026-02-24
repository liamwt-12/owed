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

  return (
    <div className="min-h-screen bg-paper">
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

      <main className="ml-[240px] p-8">
        {children}
      </main>
    </div>
  )
}
