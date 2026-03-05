import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding/connect'
  const beta = searchParams.get('beta')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If beta invite code is valid, flag user as beta
      if (beta === 'OWED2026') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabaseAdmin
            .from('profiles')
            .update({ beta_user: true })
            .eq('id', user.id)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
