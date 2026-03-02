import { createClient } from '@/lib/supabase/server'
import { csrfCheck } from '@/lib/csrf'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const csrfError = csrfCheck(request)
  if (csrfError) return csrfError

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { invoice_id } = await request.json()

  const { error } = await supabase
    .from('invoices')
    .update({ chasing_enabled: false })
    .eq('id', invoice_id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Pause invoice error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // Cancel any scheduled chase emails
  await supabase
    .from('chase_emails')
    .update({ status: 'cancelled' })
    .eq('invoice_id', invoice_id)
    .eq('status', 'scheduled')

  return NextResponse.json({ ok: true })
}
