import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function UpgradePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // If user already has active sub, send them to dashboard
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at')
    .eq('user_id', user.id)
    .single()

  const isActive = subscription?.status === 'active'
  const isTrialing = subscription?.status === 'trialing' &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) > new Date()

  if (isActive || isTrialing) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-3 h-3 bg-pop rounded-full mx-auto mb-6" />
        <h1 className="font-syne font-extrabold text-2xl text-ink mb-3">
          Your trial has ended
        </h1>
        <p className="text-muted text-sm mb-8 leading-relaxed">
          Upgrade to keep chasing your overdue invoices automatically. Your data is safe — pick up right where you left off.
        </p>
        <a
          href="/api/stripe/checkout"
          className="inline-block w-full py-3 px-6 bg-ink text-white text-sm font-semibold rounded-lg hover:bg-ink/90 transition-colors mb-3"
        >
          Upgrade now — £14/month
        </a>
        <Link
          href="/settings"
          className="text-xs text-faint hover:text-muted transition-colors"
        >
          Manage account
        </Link>
      </div>
    </div>
  )
}
