import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  if (request.headers.get('x-admin-secret')?.trim() !== process.env.ADMIN_SECRET?.trim()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email } = await request.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('profiles')
    .update({ beta_user: true })
    .eq('email', email)
    .select('id, email, beta_user')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, user: data })
}
