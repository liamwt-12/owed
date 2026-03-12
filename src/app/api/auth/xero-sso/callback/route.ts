import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=xero_no_code`)
  }

  // CSRF: validate state parameter
  const storedState = cookies().get('xero_sso_state')?.value
  cookies().delete('xero_sso_state')

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/login?error=xero_invalid_state`)
  }

  // Exchange code for tokens
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const redirectUri = `${appUrl}/api/auth/xero-sso/callback`

  const tokenRes = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
      ).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenRes.ok) {
    console.error('Xero SSO token exchange failed:', await tokenRes.text())
    return NextResponse.redirect(`${origin}/login?error=xero_token_failed`)
  }

  const tokens = await tokenRes.json()

  // Fetch user identity from Xero
  const userInfoRes = await fetch('https://identity.xero.com/connect/userinfo', {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` },
  })

  if (!userInfoRes.ok) {
    console.error('Xero userinfo failed:', await userInfoRes.text())
    return NextResponse.redirect(`${origin}/login?error=xero_identity_failed`)
  }

  const userInfo = await userInfoRes.json()
  const email = userInfo.email
  const fullName = [userInfo.given_name, userInfo.family_name].filter(Boolean).join(' ')

  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=xero_no_email`)
  }

  // Check if user exists by querying profiles table
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  let redirectTo: string

  if (existingProfile) {
    // Existing user — generate magic link to establish session
    redirectTo = '/dashboard'
  } else {
    // New user — create account (profile row is auto-created by DB trigger)
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createError) {
      console.error('Failed to create user via Xero SSO:', createError)
      return NextResponse.redirect(`${origin}/login?error=xero_create_failed`)
    }

    redirectTo = '/onboarding/connect'
  }

  // Generate magic link to establish Supabase session
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData) {
    console.error('Failed to generate magic link:', linkError)
    return NextResponse.redirect(`${origin}/login?error=xero_session_failed`)
  }

  const hashedToken = linkData.properties?.hashed_token
  if (!hashedToken) {
    console.error('No hashed_token in magic link response')
    return NextResponse.redirect(`${origin}/login?error=xero_session_failed`)
  }

  // Redirect to auth callback to establish the session
  const callbackUrl = new URL(`${origin}/api/auth/callback`)
  callbackUrl.searchParams.set('token_hash', hashedToken)
  callbackUrl.searchParams.set('type', 'magiclink')
  callbackUrl.searchParams.set('next', redirectTo)

  return NextResponse.redirect(callbackUrl.toString())
}
