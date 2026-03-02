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

  const body = await request.json()

  const updates: Record<string, any> = {}

  if ('business_name' in body) {
    updates.business_name = body.business_name
  }
  if ('statutory_interest_enabled' in body) {
    updates.statutory_interest_enabled = !!body.statutory_interest_enabled
  }
  if ('payment_link' in body) {
    updates.payment_link = body.payment_link || null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
