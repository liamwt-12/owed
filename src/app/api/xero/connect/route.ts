import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.XERO_CLIENT_ID
  const redirectUri = process.env.XERO_REDIRECT_URI
  const scopes = 'openid profile email accounting.transactions.read offline_access'

  const authUrl = new URL('https://login.xero.com/identity/connect/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId!)
  authUrl.searchParams.set('redirect_uri', redirectUri!)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('state', crypto.randomUUID())

  return NextResponse.redirect(authUrl.toString())
}
