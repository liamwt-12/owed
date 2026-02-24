import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: connections } = await supabase
    .from('connections')
    .select('id')
    .eq('user_id', user!.id)
    .limit(1)

  if (!connections || connections.length === 0) {
    return (
      <div className="max-w-[500px] mx-auto mt-20 text-center">
        <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-3">
          Connect Xero to get started
        </h1>
        <p className="text-muted text-[15px] mb-8 leading-relaxed">
          We&apos;ll find your overdue invoices and start chasing. Read-only access. We never touch your data.
        </p>
        <Link
          href="/onboarding/connect"
          className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper font-semibold text-[15px] rounded-lg hover:bg-ink-2 transition-colors"
        >
          Connect Xero
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>
      </div>
    )
  }

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user!.id)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Dashboard query error:', error)
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div>
        <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-2">
          Invoices
        </h1>
        <div className="mt-12 text-center py-16 bg-white border border-line rounded-2xl">
          <p className="text-muted text-[15px]">No overdue invoices. Enjoy it.</p>
          <p className="text-faint text-sm mt-2">Nothing to chase right now. We&apos;re watching.</p>
        </div>
      </div>
    )
  }

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'open')
    .reduce((sum, inv) => sum + Number(inv.amount_due), 0)

  const chasingCount = invoices.filter(inv => inv.status === 'open' && inv.chasing_enabled).length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-1">
            Invoices
          </h1>
          <p className="text-muted text-sm">
            {chasingCount} invoice{chasingCount !== 1 ? 's' : ''} being chased · £{totalOutstanding.toLocaleString('en-GB', { minimumFractionDigits: 2 })} outstanding
          </p>
        </div>
      </div>

      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left px-5 py-3 text-xs font-semibold text-faint uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-faint uppercase tracking-wider">Invoice #</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-faint uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-faint uppercase tracking-wider">Due Date</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-faint uppercase tracking-wider">Days Overdue</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-faint uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))

                return (
                  <tr
                    key={invoice.id}
                    className="border-b border-line last:border-0 hover:bg-cream/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-ink">
                        {invoice.contact_name}
                      </span>
                      {!invoice.contact_email && (
                        <p className="text-xs text-pop mt-0.5">Missing email</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted font-mono">
                      {invoice.invoice_number || '—'}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-ink text-right font-mono">
                      £{Number(invoice.amount_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">
                      {new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-right font-mono">
                      <span className={daysOverdue > 14 ? 'text-pop' : daysOverdue > 7 ? 'text-amber' : 'text-ink'}>
                        {daysOverdue}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={invoice.status} chasingEnabled={invoice.chasing_enabled} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status, chasingEnabled }: { status: string; chasingEnabled: boolean }) {
  const styles: Record<string, string> = {
    open: chasingEnabled
      ? 'bg-indigo/10 text-indigo'
      : 'bg-cream text-faint',
    paid: 'bg-green-pale text-green',
    paused: 'bg-cream text-faint',
    completed: 'bg-cream text-muted',
  }

  const labels: Record<string, string> = {
    open: chasingEnabled ? 'Chasing' : 'Paused',
    paid: 'Paid',
    paused: 'Paused',
    completed: 'Completed',
  }

  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.open}`}>
      {labels[status] || status}
    </span>
  )
}
