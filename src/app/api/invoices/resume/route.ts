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
    .update({ chasing_enabled: true })
    .eq('id', invoice_id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Resume invoice error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
