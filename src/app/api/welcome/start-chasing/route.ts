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

  // Enable chasing on all open overdue invoices that have an email
  await supabase
    .from('invoices')
    .update({ chasing_enabled: true })
    .eq('user_id', user.id)
    .eq('status', 'open')
    .not('contact_email', 'is', null)
    .lt('due_date', new Date().toISOString().split('T')[0])

  // Mark welcome as seen
  await supabase
    .from('profiles')
    .update({ welcome_seen: true })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
