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

function getEmailContent(stage: number, invoice: any, businessName: string, unsubscribeUrl: string) {
  const contact = escapeHtml(invoice.contact_name?.split(' ')[0] || 'there')
  const amount = escapeHtml(`£${Number(invoice.amount_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`)
  const number = escapeHtml(invoice.invoice_number || 'your invoice')
  const dueDate = escapeHtml(new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
  const safeBusiness = escapeHtml(businessName)
  const footer = `<p style="color:#999;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">Sent on behalf of ${safeBusiness} · Powered by Owed · <a href="${unsubscribeUrl}" style="color:#999">Unsubscribe</a></p>`

  switch (stage) {
    case 1:
      return {
        subject: `Invoice ${number} — Quick reminder`,
        html: `<p>Hi ${contact},</p>
<p>Just a quick note that invoice ${number} for ${amount} was due on ${dueDate}.</p>
<p>If you've already sent payment, please ignore this — and thank you.</p>
<p>If not, do let us know if you have any questions.</p>
<p>Many thanks,<br>${safeBusiness}</p>
${footer}`,
      }
    case 2:
      return {
        subject: `Invoice ${number} — Payment outstanding`,
        html: `<p>Hi ${contact},</p>
<p>Following up on invoice ${number} for ${amount}, which remains outstanding.</p>
<p>Could you let me know when we can expect payment, or if there's anything we can help resolve on our end?</p>
<p>Thanks,<br>${safeBusiness}</p>
${footer}`,
      }
    case 3:
      return {
        subject: `Invoice ${number} — Action required`,
        html: `<p>Hi ${contact},</p>
<p>Invoice ${number} for ${amount} is now significantly overdue. We'd appreciate confirmation of payment within 5 working days.</p>
<p>If there's an issue with this invoice, please reply and we'll be happy to discuss.</p>
<p>Regards,<br>${safeBusiness}</p>
${footer}`,
      }
    case 4:
      return {
        subject: `Invoice ${number} — Final notice`,
        html: `<p>Hi ${contact},</p>
<p>This is a final reminder regarding invoice ${number} for ${amount}.</p>
<p>If payment is not received shortly, we may need to consider further action in line with our terms.</p>
<p>We'd strongly prefer to resolve this directly — please reply or arrange payment at your earliest convenience.</p>
<p>${safeBusiness}</p>
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
    .select('*, profiles!inner(email, business_name)')
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

      const { subject, html } = getEmailContent(nextStage, invoice, businessName, unsubscribeUrl)

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'accounts@owedhq.com',
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
