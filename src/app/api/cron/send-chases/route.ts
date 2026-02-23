import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_TEMPLATES = {
  1: {
    subject: (num: string) => `Invoice ${num} — Quick reminder`,
    body: (contact: string, num: string, amount: string, date: string, business: string) =>
      `Hi ${contact},\n\nJust a quick note that invoice ${num} for ${amount} was due on ${date}.\n\nIf you've already sent payment, please ignore this — and thank you.\n\nIf not, do let us know if you have any questions.\n\nMany thanks,\n${business}`,
  },
  2: {
    subject: (num: string) => `Invoice ${num} — Payment outstanding`,
    body: (contact: string, num: string, amount: string, _date: string, business: string) =>
      `Hi ${contact},\n\nFollowing up on invoice ${num} for ${amount}, which remains outstanding.\n\nCould you let me know when we can expect payment, or if there's anything we can help resolve on our end?\n\nThanks,\n${business}`,
  },
  3: {
    subject: (num: string) => `Invoice ${num} — Action required`,
    body: (contact: string, num: string, amount: string, _date: string, business: string) =>
      `Hi ${contact},\n\nInvoice ${num} for ${amount} is now 14 days overdue. We'd appreciate confirmation of payment within 5 working days.\n\nIf there's an issue with this invoice, please reply and we'll be happy to discuss.\n\nRegards,\n${business}`,
  },
  4: {
    subject: (num: string) => `Invoice ${num} — Final notice`,
    body: (contact: string, num: string, amount: string, _date: string, business: string) =>
      `Hi ${contact},\n\nThis is a final reminder regarding invoice ${num} for ${amount}, now 21 days overdue.\n\nIf payment is not received shortly, we may need to consider further action in line with our terms.\n\nWe'd strongly prefer to resolve this directly — please reply or arrange payment at your earliest convenience.\n\n${business}`,
  },
} as const

// Days after previous stage to send next
const STAGE_GAPS: Record<number, number> = { 1: 0, 2: 6, 3: 7, 4: 7 }

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all open, chasing-enabled invoices that are overdue
  const { data: invoices } = await supabaseAdmin
    .from('invoices')
    .select('*, chase_emails(*)')
    .eq('status', 'open')
    .eq('chasing_enabled', true)
    .gt('days_overdue', 0)

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No invoices to chase' })
  }

  let sent = 0

  for (const invoice of invoices) {
    try {
      const sentEmails = (invoice.chase_emails || [])
        .filter((e: any) => e.status === 'sent')
        .sort((a: any, b: any) => a.stage - b.stage)

      const lastSentStage = sentEmails.length > 0
        ? sentEmails[sentEmails.length - 1].stage
        : 0

      // If all 4 stages sent, mark as completed
      if (lastSentStage >= 4) {
        await supabaseAdmin.from('invoices').update({
          status: 'completed',
        }).eq('id', invoice.id)
        continue
      }

      const nextStage = lastSentStage + 1

      // Check if enough days have passed since last email
      if (lastSentStage > 0) {
        const lastSent = sentEmails[sentEmails.length - 1]
        const daysSinceLastEmail = Math.floor(
          (Date.now() - new Date(lastSent.sent_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceLastEmail < STAGE_GAPS[nextStage]) {
          continue // Not time yet
        }
      }

      // Skip if no email address
      if (!invoice.contact_email) continue

      // Get user's business name
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('business_name, email')
        .eq('id', invoice.user_id)
        .single()

      const businessName = profile?.business_name || 'Our team'
      const template = EMAIL_TEMPLATES[nextStage as keyof typeof EMAIL_TEMPLATES]
      const amount = `£${Number(invoice.amount_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
      const dueDate = new Date(invoice.due_date).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })

      const contactFirstName = invoice.contact_name.split(' ')[0]

      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        replyTo: profile?.email || undefined,
        to: [invoice.contact_email],
        subject: template.subject(invoice.invoice_number || invoice.external_id),
        text: template.body(contactFirstName, invoice.invoice_number || invoice.external_id, amount, dueDate, businessName)
          + `\n\n---\nSent on behalf of ${businessName} · Powered by Owed`,
      })

      if (emailError) {
        console.error(`Failed to send chase email for invoice ${invoice.id}:`, emailError)
        continue
      }

      // Record the chase email
      await supabaseAdmin.from('chase_emails').insert({
        invoice_id: invoice.id,
        user_id: invoice.user_id,
        stage: nextStage,
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        resend_message_id: emailResult?.id || null,
        status: 'sent',
      })

      sent++
    } catch (err) {
      console.error(`Chase error for invoice ${invoice.id}:`, err)
    }
  }

  return NextResponse.json({ sent, total: invoices.length })
}
