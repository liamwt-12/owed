import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const clientId = process.env.XERO_CLIENT_ID
  const redirectUri = process.env.XERO_REDIRECT_URI
  const scopes = 'openid profile email accounting.transactions.read offline_access'

  const state = crypto.randomUUID()

  // Store state in httpOnly cookie for CSRF validation
  cookies().set('xero_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  const authUrl = new URL('https://login.xero.com/identity/connect/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId!)
  authUrl.searchParams.set('redirect_uri', redirectUri!)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
