import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PauseResumeButton } from './PauseResumeButton'
import { MarkPaidButton } from './MarkPaidButton'

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!invoice) notFound()

  const { data: chaseEmails } = await supabase
    .from('chase_emails')
    .select('*')
    .eq('invoice_id', invoice.id)
    .order('stage', { ascending: true })

  const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))
  const stageNames = ['', 'Friendly reminder', 'Payment outstanding', 'Action required', 'Final notice']
  const sentEmails = (chaseEmails || []).filter(e => e.status === 'sent')
  const firstSent = sentEmails.length > 0 ? new Date(sentEmails[0].sent_at) : null
  const lastSent = sentEmails.length > 0 ? new Date(sentEmails[sentEmails.length - 1].sent_at) : null
  const chaseDays = firstSent && lastSent ? Math.max(1, Math.floor((lastSent.getTime() - firstSent.getTime()) / (1000 * 60 * 60 * 24))) : 0

  return (
    <div className="max-w-[640px]">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Invoices
      </Link>

      {invoice.status === 'paid' && (
        <div className="bg-green text-white rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="font-syne font-extrabold text-lg">
              £{Number(invoice.amount_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })} received.
            </p>
          </div>
          {sentEmails.length > 0 && (
            <p className="text-white/75 text-sm ml-[52px]">
              Owed sent {sentEmails.length} email{sentEmails.length !== 1 ? 's' : ''} over {chaseDays} day{chaseDays !== 1 ? 's' : ''}. Chasing stopped automatically.
            </p>
          )}
        </div>
      )}

      {invoice.status === 'completed' && (
        <div className="bg-cream border border-line rounded-2xl p-6 mb-6">
          <p className="text-[15px] font-medium text-ink mb-1">Sequence complete.</p>
          <p className="text-sm text-muted">This invoice has completed our 4-stage sequence. Might be time to pick up the phone.</p>
        </div>
      )}

      <div className="bg-white border border-line rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-syne font-extrabold text-xl text-ink tracking-tight">{invoice.contact_name}</h1>
            <p className="text-sm text-muted font-mono mt-1">{invoice.invoice_number || 'No invoice number'}</p>
            {invoice.contact_email && <p className="text-sm text-muted mt-0.5">{invoice.contact_email}</p>}
          </div>
          <div className="text-right">
            <p className="font-syne font-extrabold text-2xl text-ink font-mono">£{Number(invoice.amount_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
            {invoice.status === 'open' && (
              <p className={`text-sm font-semibold font-mono mt-1 ${daysOverdue > 14 ? 'text-pop' : daysOverdue > 7 ? 'text-amber' : 'text-muted'}`}>
                {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-line">
          <div className="text-xs text-faint">Due {new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div className="w-1 h-1 bg-line rounded-full" />
          <div className="text-xs text-faint">{invoice.currency}</div>
          {!invoice.contact_email && (
            <>
              <div className="w-1 h-1 bg-line rounded-full" />
              <div className="text-xs text-pop font-semibold">No email on file</div>
            </>
          )}
        </div>
      </div>

      {invoice.status === 'open' && (
        <div className="flex gap-2 mb-6">
          <PauseResumeButton invoiceId={invoice.id} chasingEnabled={invoice.chasing_enabled} />
          <MarkPaidButton invoiceId={invoice.id} />
        </div>
      )}

      {!invoice.contact_email && invoice.status === 'open' && (
        <div className="bg-pop-pale border border-pop/20 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-ink mb-1">We couldn&apos;t find an email for this client.</p>
          <p className="text-xs text-muted">Add their email address in Xero and we&apos;ll pick it up on the next sync. Then we&apos;ll get started.</p>
        </div>
      )}

      {daysOverdue >= 14 && invoice.status === 'open' && (
        <div className="bg-amber-pale border border-amber/20 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-ink mb-1">Late Payment Act</p>
          <p className="text-xs text-muted">
            Under the Late Commercial Payments (Interest) Act, you may be entitled to charge interest at 8% + Bank of England base rate on this invoice, plus a fixed sum of £{Number(invoice.amount_due) < 1000 ? '40' : Number(invoice.amount_due) < 10000 ? '70' : '100'}.
          </p>
        </div>
      )}

      <div className="bg-white border border-line rounded-2xl p-6">
        <h2 className="text-xs font-semibold text-faint uppercase tracking-wider mb-6">Chase Timeline</h2>

        {(!chaseEmails || chaseEmails.length === 0) && invoice.chasing_enabled && invoice.contact_email && (
          <p className="text-sm text-muted">First chase email will be sent at 8am tomorrow.</p>
        )}
        {(!chaseEmails || chaseEmails.length === 0) && !invoice.chasing_enabled && (
          <p className="text-sm text-muted">Chasing is paused for this invoice.</p>
        )}
        {(!chaseEmails || chaseEmails.length === 0) && !invoice.contact_email && (
          <p className="text-sm text-muted">No emails sent — this client has no email address on file.</p>
        )}

        {chaseEmails && chaseEmails.length > 0 && (
          <div className="relative">
            {chaseEmails.map((email, index) => (
              <div key={email.id} className="flex gap-4 mb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                    email.status === 'sent' ? 'bg-ink' : email.status === 'cancelled' ? 'bg-line' : 'border-2 border-line bg-white'
                  }`} />
                  {index < chaseEmails.length - 1 && <div className="w-px flex-1 bg-line my-1 min-h-[40px]" />}
                </div>
                <div className="pb-6 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-ink">Stage {email.stage}: {stageNames[email.stage]}</p>
                    {email.status === 'cancelled' && <span className="text-xs text-faint bg-cream px-2 py-0.5 rounded-full">Cancelled</span>}
                  </div>
                  <p className="text-xs text-muted mb-1">
                    {email.status === 'sent' && email.sent_at
                      ? `Sent ${new Date(email.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${new Date(email.sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                      : email.status === 'scheduled'
                      ? `Scheduled for ${new Date(email.scheduled_for).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                      : email.status === 'cancelled' ? 'Cancelled' : ''}
                  </p>
                  {email.opened_at && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-amber rounded-full" />
                      <p className="text-xs text-amber font-medium">Likely opened {new Date(email.opened_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {invoice.status === 'open' && invoice.chasing_enabled && chaseEmails.length < 4 && (
              <>
                {Array.from({ length: 4 - chaseEmails.length }, (_, i) => {
                  const nextStage = chaseEmails.length + i + 1
                  return (
                    <div key={`upcoming-${nextStage}`} className="flex gap-4 mb-0">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 border-2 border-dashed border-line bg-white" />
                        {nextStage < 4 && <div className="w-px flex-1 bg-line/50 my-1 min-h-[40px]" />}
                      </div>
                      <div className="pb-6 flex-1">
                        <p className="text-sm font-medium text-faint">Stage {nextStage}: {stageNames[nextStage]}</p>
                        <p className="text-xs text-faint">Upcoming</p>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
