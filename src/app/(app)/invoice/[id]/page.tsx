import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PauseResumeButton } from './PauseResumeButton'
import { MarkPaidButton } from './MarkPaidButton'
import { TheyRepliedButton } from './TheyRepliedButton'
import { CallButton } from './CallButton'

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

  const { data: activity } = await supabase
    .from('invoice_activity')
    .select('*')
    .eq('invoice_id', invoice.id)
    .order('created_at', { ascending: false })

  const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))
  const stageNames = ['', 'Friendly reminder', 'Payment outstanding', 'Action required', 'Final notice']
  const sentEmails = (chaseEmails || []).filter(e => e.status === 'sent')
  const firstSent = sentEmails.length > 0 ? new Date(sentEmails[0].sent_at) : null
  const lastSent = sentEmails.length > 0 ? new Date(sentEmails[sentEmails.length - 1].sent_at) : null
  const chaseDays = firstSent && lastSent ? Math.max(1, Math.floor((lastSent.getTime() - firstSent.getTime()) / (1000 * 60 * 60 * 24))) : 0

  const hasReplied = invoice.pause_reason === 'replied'

  return (
    <div className="max-w-[640px]">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Invoices
      </Link>

      {/* Paid moment */}
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

      {/* Completed */}
      {invoice.status === 'completed' && (
        <div className="bg-cream border border-line rounded-2xl p-6 mb-6">
          <p className="text-[15px] font-medium text-ink mb-1">Sequence complete.</p>
          <p className="text-sm text-muted">This invoice has completed our 4-stage sequence. Might be time to pick up the phone.</p>
          {invoice.contact_phone && (
            <CallButton invoiceId={invoice.id} phone={invoice.contact_phone} contactName={invoice.contact_name} />
          )}
        </div>
      )}

      {/* Invoice header */}
      <div className="bg-white border border-line rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-syne font-extrabold text-xl text-ink tracking-tight">{invoice.contact_name}</h1>
            <p className="text-sm text-muted font-mono mt-1">{invoice.invoice_number || 'No invoice number'}</p>
            {invoice.contact_email && <p className="text-sm text-muted mt-0.5">{invoice.contact_email}</p>}
            {invoice.contact_phone && <p className="text-sm text-muted mt-0.5">{invoice.contact_phone}</p>}
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

      {/* Actions */}
      {invoice.status === 'open' && (
        <div className="flex flex-wrap gap-2 mb-4">
          <PauseResumeButton invoiceId={invoice.id} chasingEnabled={invoice.chasing_enabled} />
          <MarkPaidButton invoiceId={invoice.id} />
          {invoice.contact_phone && (
            <CallButton invoiceId={invoice.id} phone={invoice.contact_phone} contactName={invoice.contact_name} />
          )}
        </div>
      )}

      {/* They replied prompt */}
      {invoice.status === 'open' && invoice.chasing_enabled && sentEmails.length > 0 && (
        <TheyRepliedButton invoiceId={invoice.id} />
      )}

      {/* Replied badge */}
      {hasReplied && (
        <div className="bg-indigo/5 border border-indigo/20 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-ink">Client replied — chasing paused.</p>
          <p className="text-xs text-muted mt-1">Resume chasing when you&apos;re ready.</p>
        </div>
      )}

      {/* Missing email */}
      {!invoice.contact_email && invoice.status === 'open' && (
        <div className="bg-pop-pale border border-pop/20 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-ink mb-1">We couldn&apos;t find an email for this client.</p>
          <p className="text-xs text-muted">Add their email address in Xero and we&apos;ll pick it up on the next sync.</p>
        </div>
      )}

      {/* Late Payment Act */}
      {daysOverdue >= 14 && invoice.status === 'open' && (
        <div className="bg-amber-pale border border-amber/20 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-ink mb-1">Late Payment Act</p>
          <p className="text-xs text-muted">
            Under the Late Commercial Payments (Interest) Act, you may be entitled to charge interest at 8% + Bank of England base rate, plus a fixed sum of £{Number(invoice.amount_due) < 1000 ? '40' : Number(invoice.amount_due) < 10000 ? '70' : '100'}.
          </p>
        </div>
      )}

      {/* Chase Timeline */}
      <div className="bg-white border border-line rounded-2xl p-6 mb-4">
        <h2 className="text-xs font-semibold text-faint uppercase tracking-wider mb-6">Chase Timeline</h2>

        {(!chaseEmails || chaseEmails.length === 0) && invoice.chasing_enabled && invoice.contact_email && (
          <p className="text-sm text-muted">First chase email will be sent at 8am tomorrow.</p>
        )}
        {(!chaseEmails || chaseEmails.length === 0) && !invoice.chasing_enabled && !hasReplied && (
          <p className="text-sm text-muted">Chasing is paused for this invoice.</p>
        )}
        {(!chaseEmails || chaseEmails.length === 0) && !invoice.contact_email && (
          <p className="text-sm text-muted">No emails sent — no email address on file.</p>
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

      {/* Activity log */}
      {activity && activity.length > 0 && (
        <div className="bg-white border border-line rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-faint uppercase tracking-wider mb-4">Activity</h2>
          <div className="flex flex-col gap-3">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  item.type === 'call' ? 'bg-indigo/10 text-indigo' :
                  item.type === 'reply' ? 'bg-amber-pale text-amber' :
                  item.type === 'paid' ? 'bg-green-pale text-green' :
                  'bg-cream text-muted'
                }`}>
                  {item.type === 'call' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
                  {item.type === 'reply' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>}
                  {item.type === 'paid' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                  {(item.type === 'paused' || item.type === 'resumed' || item.type === 'note') && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/></svg>}
                </div>
                <div>
                  <p className="text-sm text-ink">{item.note}</p>
                  <p className="text-xs text-faint mt-0.5">{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at {new Date(item.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
