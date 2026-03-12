import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// NOTE: Supabase dashboard email template for "Reset Password" should use:
// <h2>Reset your Owed password</h2>
// <p>Click the link below to set a new password.</p>
// <p><a href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset password</a></p>

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as any
  const next = searchParams.get('next') ?? '/onboarding/connect'

  const supabase = createClient()
  let sessionEstablished = false

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) sessionEstablished = true
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) sessionEstablished = true
  }

  if (!sessionEstablished) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // Check for beta cookie and activate server-side
  const betaCookie = cookies().get('owed_beta')?.value
  if (betaCookie === 'OWED2026') {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        await fetch(`${origin}/api/admin/set-beta`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': process.env.ADMIN_SECRET || '',
          },
          body: JSON.stringify({ email: user.email }),
        })
      } catch (e) {
        console.error('Failed to activate beta:', e)
      }
    }
    // Clear the beta cookie
    cookies().set('owed_beta', '', { path: '/', maxAge: 0 })
  }

  return NextResponse.redirect(`${origin}${next}`)
}
