import { supabaseAdmin } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

const PROMISE_THRESHOLD = 435 // 5 x £29 x 3 months
const CREDIT_AMOUNT = 8700   // £87 in pence (3 x £29)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data: users, error: queryError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, business_name, total_recovered, tracking_start_date')
    .not('tracking_start_date', 'is', null)
    .eq('promise_checked', false)
    .lte('tracking_start_date', ninetyDaysAgo)

  if (queryError) {
    console.error('Recovery promise query error:', queryError)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ checked: 0, credited: 0, already_met: 0, errors: 0 })
  }

  let credited = 0
  let alreadyMet = 0
  let errors = 0

  for (const user of users) {
    try {
      const totalRecovered = Number(user.total_recovered) || 0

      if (totalRecovered >= PROMISE_THRESHOLD) {
        await supabaseAdmin
          .from('profiles')
          .update({ promise_checked: true })
          .eq('id', user.id)
        alreadyMet++
        console.log(`Recovery promise: user ${user.id} met threshold (${totalRecovered})`)
        continue
      }

      // Need to credit — find Stripe customer ID
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single()

      if (!sub?.stripe_customer_id) {
        console.warn(`Recovery promise: user ${user.id} has no Stripe customer ID, skipping`)
        errors++
        continue
      }

      // Apply credit via Stripe balance transaction
      await stripe.customers.createBalanceTransaction(sub.stripe_customer_id, {
        amount: -CREDIT_AMOUNT,
        currency: 'gbp',
        description: '5x Recovery Promise — 3 months free',
      })

      // Mark in database
      await supabaseAdmin
        .from('profiles')
        .update({ promise_checked: true, promise_credit_applied: true })
        .eq('id', user.id)

      // Send email
      const name = user.business_name || user.email.split('@')[0]
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'accounts@owedhq.com',
          to: user.email,
          subject: 'We meant what we said',
          html: `<p style="font-size:15px;color:#0F0E0C;line-height:1.6">Hi ${name},</p>
<p style="font-size:15px;color:#0F0E0C;line-height:1.6">When you signed up, we promised that if Owed didn\u2019t recover at least 5x your subscription cost in 90 days, the next 3 months would be on us.</p>
<p style="font-size:15px;color:#0F0E0C;line-height:1.6">Your account has been credited with \u00a387. It will be applied automatically to your next 3 invoices.</p>
<p style="font-size:15px;color:#0F0E0C;line-height:1.6">We hope you\u2019ll give us another chance to prove our worth.</p>
<p style="font-size:14px;color:#6E6B63;margin-top:24px">The Owed team</p>
<p style="color:#B5B2AA;font-size:12px;margin-top:32px;border-top:1px solid #E4E0D8;padding-top:16px"><a href="https://owedhq.com/dashboard" style="color:#B5B2AA">View dashboard</a></p>`,
        }),
      })

      credited++
      console.log(`Recovery promise: credited user ${user.id} (recovered ${totalRecovered} < ${PROMISE_THRESHOLD})`)
    } catch (err) {
      console.error(`Recovery promise error for user ${user.id}:`, err)
      errors++
    }
  }

  return NextResponse.json({
    checked: users.length,
    credited,
    already_met: alreadyMet,
    errors,
  })
}
