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

  const { business_name } = await request.json()

  const { error } = await supabase
    .from('profiles')
    .update({ business_name })
    .eq('id', user.id)

  if (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
