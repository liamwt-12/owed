import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delete connection
  await supabase
    .from('connections')
    .delete()
    .eq('user_id', user.id)

  // Cancel all scheduled chase emails
  await supabase
    .from('chase_emails')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .eq('status', 'scheduled')

  // Pause all invoices
  await supabase
    .from('invoices')
    .update({ chasing_enabled: false })
    .eq('user_id', user.id)
    .eq('status', 'open')

  return NextResponse.json({ ok: true })
}
