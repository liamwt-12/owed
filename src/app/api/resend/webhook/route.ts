import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const payload = await request.json()

  if (payload.type === 'email.opened') {
    const messageId = payload.data?.email_id
    if (messageId) {
      await supabaseAdmin
        .from('chase_emails')
        .update({ opened_at: new Date().toISOString() })
        .eq('resend_message_id', messageId)
        .is('opened_at', null)
    }
  }

  return NextResponse.json({ ok: true })
}
