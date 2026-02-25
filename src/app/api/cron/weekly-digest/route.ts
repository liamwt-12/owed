import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
      // Get invoices paid this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data: paidThisWeek } = await supabaseAdmin
        .from('invoice_activity')
        .select('invoice_id, created_at, invoices!inner(amount_due, contact_name)')
        .eq('user_id', profile.id)
        .eq('type', 'paid')
        .gte('created_at', weekAgo)

      const { data: openInvoices } = await supabaseAdmin
        .from('invoices')
        .select('id, contact_name, amount_due, chasing_enabled, status')
        .eq('user_id', profile.id)
        .eq('status', 'open')

      const { data: completedInvoices } = await supabaseAdmin
        .from('invoices')
        .select('id, contact_name, amount_due')
        .eq('user_id', profile.id)
        .eq('status', 'completed')

      const chasingCount = openInvoices?.filter(i => i.chasing_enabled).length || 0
      const totalOutstanding = openInvoices?.reduce((sum, i) => sum + Number(i.amount_due), 0) || 0
      const paidCount = paidThisWeek?.length || 0
      const paidTotal = paidThisWeek?.reduce((sum, p) => sum + Number((p as any).invoices?.amount_due || 0), 0) || 0

      // Don't send if nothing to report
      if (chasingCount === 0 && paidCount === 0 && (!completedInvoices || completedInvoices.length === 0)) {
        continue
      }

      // Build email
      let body = `<p>Hi${profile.business_name ? ' ' + profile.business_name : ''},</p><p>Here's your weekly update from Owed.</p>`

      if (paidCount > 0) {
        body += `<p style="color:#1A6644;font-weight:600">£${paidTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })} received this week (${paidCount} invoice${paidCount !== 1 ? 's' : ''} paid).</p>`
      }

      if (chasingCount > 0) {
        body += `<p>${chasingCount} invoice${chasingCount !== 1 ? 's' : ''} being chased — £${totalOutstanding.toLocaleString('en-GB', { minimumFractionDigits: 2 })} outstanding.</p>`
      }

      if (completedInvoices && completedInvoices.length > 0) {
        for (const inv of completedInvoices) {
          body += `<p style="color:#D4820A">${inv.contact_name} has completed our sequence — might be time to pick up the phone.</p>`
        }
      }

      if (chasingCount === 0 && paidCount === 0) {
        body += `<p>Nothing to chase right now. We're watching.</p>`
      }

      body += `<p style="margin-top:24px">— Owed</p>`
      body += `<p style="color:#999;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">Your weekly digest from Owed · <a href="https://owedhq.com/settings" style="color:#999">Manage preferences</a></p>`

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'accounts@owedhq.com',
          to: profile.email,
          subject: paidCount > 0
            ? `£${paidTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })} received this week`
            : `${chasingCount} invoice${chasingCount !== 1 ? 's' : ''} being chased`,
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
