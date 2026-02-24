import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { invoice_id } = await request.json()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('amount_due')
    .eq('id', invoice_id)
    .eq('user_id', user.id)
    .single()

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'paid', chasing_enabled: false })
    .eq('id', invoice_id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase
    .from('chase_emails')
    .update({ status: 'cancelled' })
    .eq('invoice_id', invoice_id)
    .eq('status', 'scheduled')

  try {
    await supabaseAdmin.rpc('increment_recovered', {
      amount: invoice.amount_due,
    })
  } catch (e) {
    console.error('Failed to increment platform stats:', e)
  }

  return NextResponse.json({ ok: true })
}
