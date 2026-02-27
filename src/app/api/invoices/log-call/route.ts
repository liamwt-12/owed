import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { invoice_id, contact_name } = await request.json()

  // Verify invoice belongs to this user
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('id', invoice_id)
    .eq('user_id', user.id)
    .single()

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  await supabase
    .from('invoice_activity')
    .insert({
      invoice_id,
      user_id: user.id,
      type: 'call',
      note: `Called ${contact_name || 'contact'}`,
    })

  return NextResponse.json({ ok: true })
}
