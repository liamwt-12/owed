import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

function verifyWebhookSignature(body: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return false

  const svixId = headers.get('svix-id')
  const svixTimestamp = headers.get('svix-timestamp')
  const svixSignature = headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) return false

  // Reject stale webhooks (> 5 minutes)
  const timestamp = parseInt(svixTimestamp, 10)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > 300) return false

  const secretBytes = Buffer.from(secret.split('_')[1] || secret, 'base64')
  const toSign = `${svixId}.${svixTimestamp}.${body}`
  const expected = crypto
    .createHmac('sha256', secretBytes)
    .update(toSign)
    .digest('base64')

  // Svix sends multiple signatures separated by spaces
  const signatures = svixSignature.split(' ')
  return signatures.some(sig => {
    const sigValue = sig.split(',')[1] || sig
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(sigValue)
    )
  })
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  if (!verifyWebhookSignature(rawBody, request.headers)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)

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
