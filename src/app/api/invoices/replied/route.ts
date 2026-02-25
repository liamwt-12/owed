import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { invoice_id } = await request.json()

  await supabase
    .from('invoices')
    .update({ chasing_enabled: false, pause_reason: 'replied' })
    .eq('id', invoice_id)
    .eq('user_id', user.id)

  await supabase
    .from('chase_emails')
    .update({ status: 'cancelled' })
    .eq('invoice_id', invoice_id)
    .eq('status', 'scheduled')

  await supabase
    .from('invoice_activity')
    .insert({
      invoice_id,
      user_id: user.id,
      type: 'reply',
      note: 'Client replied — chasing paused',
    })

  return NextResponse.json({ ok: true })
}
