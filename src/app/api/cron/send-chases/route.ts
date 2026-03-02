import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const STAGE_DELAYS = [0, 0, 6, 7, 7]

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getEmailContent(
  stage: number,
  invoice: any,
  businessName: string,
  unsubscribeUrl: string,
  options: { statutoryInterest?: boolean; paymentLink?: string },
) {
  const firstName = escapeHtml(invoice.contact_name?.split(' ')[0] || 'there')
  const amount = escapeHtml(`£${Number(invoice.amount_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`)
  const number = escapeHtml(invoice.invoice_number || 'your invoice')
  const dueDate = escapeHtml(new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
  const sender = escapeHtml(businessName)

  const footer = `<p style="color:#999;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">Sent by ${sender} · <a href="${unsubscribeUrl}" style="color:#999">Unsubscribe</a></p>`

  // Pay now button
  const payButton = options.paymentLink
    ? `<p style="margin-top:20px"><a href="${escapeHtml(options.paymentLink)}" style="display:inline-block;background:#E8420E;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px">Pay this invoice</a></p>`
    : ''

  // Statutory interest paragraph (stages 3-4 only)
  let interestParagraph = ''
  if (options.statutoryInterest && (stage === 3 || stage === 4)) {
    const amountNum = Number(invoice.amount_due)
    const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))
    const interest = amountNum * 0.1175 / 365 * daysOverdue
    const compensation = amountNum >= 10000 ? 100 : amountNum >= 1000 ? 70 : 40
    const interestFormatted = `\u00a3${interest.toFixed(2)}`
    const compFormatted = `\u00a3${compensation.toFixed(2)}`
    interestParagraph = `<p style="margin-top:16px;padding:16px;background:#f9f9f6;border-left:3px solid #ddd;font-size:13px;color:#555">Under the Late Payment of Commercial Debts Act 1998, statutory interest of ${interestFormatted} has accrued on this invoice (8% + Bank of England base rate of 3.75%, calculated daily from the due date). Compensation of ${compFormatted} is also applicable.</p>`
  }

  switch (stage) {
    case 1:
      return {
        subject: `Invoice ${number} \u2014 Quick reminder`,
        html: `<p>Hi ${firstName},</p>
<p>Just a quick note that invoice ${number} for ${amount} was due on ${dueDate}. If you've already sent payment, please ignore this.</p>
<p>If not, I'd appreciate it if you could arrange payment at your earliest convenience.</p>
${payButton}
<p>Thanks,<br>${sender}</p>
${footer}`,
      }
    case 2:
      return {
        subject: `Invoice ${number} \u2014 Payment outstanding`,
        html: `<p>Hi ${firstName},</p>
<p>Following up on invoice ${number} for ${amount}, which is now a week overdue. Could you let me know when I can expect payment? Happy to discuss if there's an issue.</p>
${payButton}
<p>${sender}</p>
${footer}`,
      }
    case 3:
      return {
        subject: `Invoice ${number} \u2014 Action required`,
        html: `<p>Invoice ${number} for ${amount} is now 14 days overdue. I'd appreciate confirmation of payment within 5 working days.</p>
${interestParagraph}
${payButton}
<p>${sender}</p>
${footer}`,
      }
    case 4:
      return {
        subject: `Invoice ${number} \u2014 Final notice`,
        html: `<p>This is my final reminder regarding invoice ${number} for ${amount}, now 21 days overdue. If I don't hear back within 7 days, I may need to consider next steps, which I'd really rather avoid.</p>
<p>Please get in touch.</p>
${interestParagraph}
${payButton}
<p>${sender}</p>
${footer}`,
      }
    default:
      return { subject: '', html: '' }
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let sent = 0
  let completed = 0
  let errors = 0

  // Only chase for users with active subscription or valid trial
  const { data: activeUserIds } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .or('status.eq.active,status.eq.trialing')

  const allowedUserIds = (activeUserIds || [])
    .filter((s: any) => {
      if (s.status === 'trialing' && s.trial_ends_at) {
        return new Date(s.trial_ends_at) > new Date()
      }
      return true
    })
    .map((s: any) => s.user_id)

  if (allowedUserIds.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No active subscriptions' })
  }

  const { data: invoices } = await supabaseAdmin
    .from('invoices')
    .select('*, profiles!inner(email, business_name, statutory_interest_enabled, payment_link)')
    .eq('status', 'open')
    .eq('chasing_enabled', true)
    .not('contact_email', 'is', null)
    .in('user_id', allowedUserIds)

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No invoices to chase' })
  }

  for (const invoice of invoices) {
    try {
      const { data: existingEmails } = await supabaseAdmin
        .from('chase_emails')
        .select('*')
        .eq('invoice_id', invoice.id)
        .eq('status', 'sent')
        .order('stage', { ascending: false })
        .limit(1)

      const lastSentEmail = existingEmails?.[0]
      const lastStage = lastSentEmail?.stage || 0
      const nextStage = lastStage + 1

      if (nextStage > 4) {
        await supabaseAdmin
          .from('invoices')
          .update({ status: 'completed', chasing_enabled: false })
          .eq('id', invoice.id)
        completed++
        continue
      }

      if (lastSentEmail) {
        const daysSinceLast = Math.floor(
          (Date.now() - new Date(lastSentEmail.sent_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceLast < STAGE_DELAYS[nextStage]) {
          continue
        }
      }

      const { data: existingScheduled } = await supabaseAdmin
        .from('chase_emails')
        .select('id')
        .eq('invoice_id', invoice.id)
        .eq('stage', nextStage)
        .in('status', ['sent', 'scheduled'])
        .limit(1)

      if (existingScheduled && existingScheduled.length > 0) {
        continue
      }

      const profile = (invoice as any).profiles
      const businessName = profile?.business_name || 'Our records'
      const replyTo = profile?.email

      // Generate unsubscribe token from invoice ID (base64url-encoded)
      const unsubscribeToken = Buffer.from(invoice.id).toString('base64url')
      const unsubscribeUrl = `https://www.owedhq.com/unsubscribe?token=${unsubscribeToken}`

      const { subject, html } = getEmailContent(nextStage, invoice, businessName, unsubscribeUrl, {
        statutoryInterest: profile?.statutory_interest_enabled || false,
        paymentLink: profile?.payment_link || undefined,
      })

      // Use business name as sender display name
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'accounts@owedhq.com'
      const fromAddress = businessName !== 'Our records'
        ? `${businessName} <${fromEmail}>`
        : fromEmail

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: invoice.contact_email,
          reply_to: replyTo,
          subject,
          html,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      })

      if (!resendRes.ok) {
        const errText = await resendRes.text()
        console.error(`Resend error for invoice ${invoice.invoice_number}:`, errText)
        errors++
        continue
      }

      const resendData = await resendRes.json()

      await supabaseAdmin.from('chase_emails').insert({
        invoice_id: invoice.id,
        user_id: invoice.user_id,
        stage: nextStage,
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        resend_message_id: resendData.id,
        status: 'sent',
      })

      sent++
      console.log(`Sent Stage ${nextStage} to ${invoice.contact_email} for ${invoice.invoice_number}`)
    } catch (err) {
      console.error(`Chase error for invoice ${invoice.id}:`, err)
      errors++
    }
  }

  return NextResponse.json({ sent, completed, errors, total: invoices.length })
}
