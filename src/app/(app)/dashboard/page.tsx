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
      <div className="max-w-[500px] mx-auto mt-12 md:mt-20 text-center">
        <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-3">Connect Xero to get started</h1>
        <p className="text-muted text-[15px] mb-8 leading-relaxed">We&apos;ll find your overdue invoices and start chasing. Read-only access. We never touch your data.</p>
        <Link href="/onboarding/connect" className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper font-semibold text-[15px] rounded-lg hover:bg-ink-2 transition-colors">
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

  if (error) console.error('Dashboard query error:', error)

  if (!invoices || invoices.length === 0) {
    return (
      <div>
        <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-2">Invoices</h1>
        <div className="mt-8 text-center py-16 bg-white border border-line rounded-2xl">
          <p className="text-muted text-[15px]">No overdue invoices. Enjoy it.</p>
          <p className="text-faint text-sm mt-2">Nothing to chase right now. We&apos;re watching.</p>
        </div>
      </div>
    )
  }

  const openInvoices = invoices.filter(inv => inv.status === 'open')
  const totalOutstanding = openInvoices.reduce((sum, inv) => sum + Number(inv.amount_due), 0)
  const chasingCount = openInvoices.filter(inv => inv.chasing_enabled).length
  const pausedCount = openInvoices.filter(inv => !inv.chasing_enabled).length
  const paidCount = invoices.filter(inv => inv.status === 'paid').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-1">Invoices</h1>
        <p className="text-muted text-sm">
          {chasingCount > 0 && <>{chasingCount} chasing</>}
          {chasingCount > 0 && pausedCount > 0 && ' · '}
          {pausedCount > 0 && <>{pausedCount} paused</>}
          {(chasingCount > 0 || pausedCount > 0) && paidCount > 0 && ' · '}
          {paidCount > 0 && <>{paidCount} paid</>}
          {openInvoices.length > 0 && <> · £{totalOutstanding.toLocaleString('en-GB', { minimumFractionDigits: 2 })} outstanding</>}
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-line rounded-2xl overflow-hidden">
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
                <tr key={invoice.id} className="border-b border-line last:border-0 hover:bg-cream/50 transition-colors cursor-pointer group">
                  <td className="px-5 py-4">
                    <Link href={`/invoice/${invoice.id}`} className="block">
                      <span className="text-sm font-medium text-ink group-hover:underline">{invoice.contact_name}</span>
                      {!invoice.contact_email && <p className="text-xs text-pop mt-0.5">Missing email</p>}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted font-mono">{invoice.invoice_number || '—'}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-ink text-right font-mono">
                    {invoice.status === 'paid' ? <span className="text-green line-through">£{Number(invoice.amount_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span> : <>£{Number(invoice.amount_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</>}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted">{new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-right font-mono">
                    {invoice.status !== 'paid' ? <span className={daysOverdue > 14 ? 'text-pop' : daysOverdue > 7 ? 'text-amber' : 'text-ink'}>{daysOverdue}</span> : <span className="text-green">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={invoice.status} chasingEnabled={invoice.chasing_enabled} hasEmail={!!invoice.contact_email} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {invoices.map((invoice) => {
          const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))
          return (
            <Link key={invoice.id} href={`/invoice/${invoice.id}`} className="block">
              <div className={`bg-white border rounded-xl p-4 transition-all active:scale-[0.98] ${invoice.status === 'paid' ? 'border-green/30 bg-green-pale/30' : 'border-line'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-[15px] font-semibold text-ink truncate">{invoice.contact_name}</p>
                    <p className="text-xs text-muted font-mono mt-0.5">{invoice.invoice_number || '—'}</p>
                  </div>
                  <StatusPill status={invoice.status} chasingEnabled={invoice.chasing_enabled} hasEmail={!!invoice.contact_email} />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-lg font-bold font-mono ${invoice.status === 'paid' ? 'text-green line-through' : 'text-ink'}`}>
                      £{Number(invoice.amount_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </p>
                    {!invoice.contact_email && invoice.status !== 'paid' && <p className="text-xs text-pop mt-1">No email — can&apos;t chase</p>}
                  </div>
                  {invoice.status !== 'paid' ? (
                    <div className="text-right">
                      <p className={`text-lg font-bold font-mono ${daysOverdue > 14 ? 'text-pop' : daysOverdue > 7 ? 'text-amber' : 'text-ink'}`}>{daysOverdue}d</p>
                      <p className="text-xs text-faint">overdue</p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green">Paid</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function StatusPill({ status, chasingEnabled, hasEmail }: { status: string; chasingEnabled: boolean; hasEmail: boolean }) {
  if (status === 'paid') return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-green-pale text-green">Paid</span>
  if (status === 'completed') return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-cream text-muted">Complete</span>
  if (!hasEmail) return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-pop-pale text-pop">No email</span>
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${chasingEnabled ? 'bg-indigo/10 text-indigo' : 'bg-cream text-faint'}`}>{chasingEnabled ? 'Chasing' : 'Paused'}</span>
}
