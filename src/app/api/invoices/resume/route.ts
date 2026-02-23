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
    .update({ chasing_enabled: true, status: 'open' })
    .eq('id', invoice_id)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
