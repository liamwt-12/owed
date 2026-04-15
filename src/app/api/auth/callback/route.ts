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

  // Check for partner cookie — mark profile as partner with unique code
  const partnerCookie = cookies().get('owed_partner')?.value
  if (partnerCookie === 'true') {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const partnerCode = generatePartnerCode()
      const { error: partnerError } = await supabase
        .from('profiles')
        .update({ partner: true, partner_code: partnerCode })
        .eq('id', user.id)
      if (partnerError) {
        console.error('Failed to set partner status:', partnerError)
      }
    }
    cookies().set('owed_partner', '', { path: '/', maxAge: 0 })
  }

  // Check for referral cookie — store who referred this user
  const refCookie = cookies().get('owed_ref')?.value
  if (refCookie) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error: refError } = await supabase
        .from('profiles')
        .update({ referred_by: refCookie })
        .eq('id', user.id)
      if (refError) {
        console.error('Failed to set referral:', refError)
      }
    }
    cookies().set('owed_ref', '', { path: '/', maxAge: 0 })
  }

  return NextResponse.redirect(`${origin}${next}`)
}

/** Generate a random 6-character uppercase alphanumeric code */
function generatePartnerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
