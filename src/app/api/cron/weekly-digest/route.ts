import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, email, business_name')

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No users' })
  }

  let sent = 0

  for (const profile of profiles) {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Invoices paid this week
      const { data: paidThisWeek } = await supabaseAdmin
        .from('invoice_activity')
        .select('invoice_id, invoices!inner(amount_due, contact_name)')
        .eq('user_id', profile.id)
        .eq('type', 'paid')
        .gte('created_at', weekAgo)

      // Open invoices
      const { data: openInvoices } = await supabaseAdmin
        .from('invoices')
        .select('id, amount_due, due_date, chasing_enabled')
        .eq('user_id', profile.id)
        .eq('status', 'open')

      const chasingCount = openInvoices?.filter(i => i.chasing_enabled).length || 0
      const openCount = openInvoices?.length || 0
      const totalOutstanding = openInvoices?.reduce((sum, i) => sum + Number(i.amount_due), 0) || 0
      const paidCount = paidThisWeek?.length || 0
      const paidTotal = paidThisWeek?.reduce((sum, p) => sum + Number((p as any).invoices?.amount_due || 0), 0) || 0

      // Longest overdue
      let longestOverdue = 0
      if (openInvoices && openInvoices.length > 0) {
        const now = Date.now()
        longestOverdue = openInvoices.reduce((max, inv) => {
          const days = Math.floor((now - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
          return days > max ? days : max
        }, 0)
      }

      // Don't send if nothing to report
      if (chasingCount === 0 && paidCount === 0 && openCount === 0) {
        continue
      }

      const fmt = (n: number) => `\u00a3${n.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`

      // Build subject
      const subject = paidCount > 0
        ? `Your week with Owed: ${fmt(paidTotal)} recovered`
        : `Your week with Owed: ${openCount} invoice${openCount !== 1 ? 's' : ''} outstanding`

      // Build body
      let body = ''

      if (paidCount > 0) {
        body += `<p style="font-size:15px;color:#0F0E0C;line-height:1.6"><strong style="color:#1A6644">Last week:</strong> ${paidCount} invoice${paidCount !== 1 ? 's' : ''} paid (${fmt(paidTotal)}).`
        if (openCount > 0) {
          body += ` Still outstanding: ${fmt(totalOutstanding)} across ${openCount} invoice${openCount !== 1 ? 's' : ''}.`
          if (longestOverdue > 0) body += ` Longest overdue: ${longestOverdue} days.`
        }
        body += `</p>`
      } else {
        body += `<p style="font-size:15px;color:#0F0E0C;line-height:1.6">No payments came in last week.`
        if (openCount > 0) {
          body += ` ${openCount} invoice${openCount !== 1 ? 's' : ''} still outstanding totalling ${fmt(totalOutstanding)}.`
          if (longestOverdue > 0) body += ` The oldest is ${longestOverdue} days overdue.`
        }
        body += `</p>`
      }

      if (chasingCount > 0) {
        body += `<p style="font-size:14px;color:#6E6B63;margin-top:16px">Owed is chasing ${chasingCount} invoice${chasingCount !== 1 ? 's' : ''} for you right now.</p>`
      }

      body += `<p style="color:#B5B2AA;font-size:12px;margin-top:32px;border-top:1px solid #E4E0D8;padding-top:16px"><a href="https://owedhq.com/dashboard" style="color:#B5B2AA">View dashboard</a> · <a href="https://owedhq.com/settings" style="color:#B5B2AA">Manage preferences</a></p>`

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'accounts@owedhq.com',
          to: profile.email,
          subject,
          html: body,
        }),
      })

      if (resendRes.ok) sent++
    } catch (err) {
      console.error(`Digest error for ${profile.email}:`, err)
    }
  }

  return NextResponse.json({ sent, total: profiles.length })
}
