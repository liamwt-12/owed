import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function FoundPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('amount_due, status')
    .eq('user_id', user.id)
    .eq('status', 'open')

  const count = invoices?.length || 0
  const total = invoices?.reduce((sum, inv) => sum + Number(inv.amount_due), 0) || 0

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="max-w-[480px] w-full text-center">
        <div className="mb-10">
          <Link href="/" className="font-syne font-extrabold text-xl text-ink inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-pop rounded-full" />
            owed
          </Link>
        </div>

        {count > 0 ? (
          <>
            <div className="mb-2">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-pop-pale border border-pop/20 rounded-full text-pop text-xs font-semibold uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-pop rounded-full" />
                Found
              </span>
            </div>

            <h1 className="font-syne font-extrabold text-3xl text-ink tracking-tight mb-3">
              We found {count} overdue invoice{count !== 1 ? 's' : ''}.
            </h1>
            <p className="text-muted text-lg mb-2">
              <span className="font-syne font-extrabold text-ink text-2xl">
                £{total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>{' '}
              outstanding.
            </p>
            <p className="text-muted text-[15px] mb-10">
              Want us to start chasing?
            </p>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3 bg-ink text-paper font-semibold text-[15px] rounded-lg hover:bg-ink-2 transition-colors"
            >
              Start chasing
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <p className="text-faint text-sm mt-4">
              Chasing begins tonight. You don&apos;t need to do anything else.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-3">
              No overdue invoices found
            </h1>
            <p className="text-muted text-[15px] mb-8 leading-relaxed">
              Nice — you&apos;re all caught up. We&apos;ll keep watching and start chasing the moment something goes overdue.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper font-semibold text-[15px] rounded-lg hover:bg-ink-2 transition-colors"
            >
              Go to dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
