import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/onboarding/connect?error=no_code`)
  }

  // Exchange code for tokens
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
      redirect_uri: process.env.XERO_REDIRECT_URI!,
    }),
  })

  if (!tokenRes.ok) {
    console.error('Xero token exchange failed:', await tokenRes.text())
    return NextResponse.redirect(`${origin}/onboarding/connect?error=token_failed`)
  }

  const tokens = await tokenRes.json()

  // Get connected tenants
  const tenantsRes = await fetch('https://api.xero.com/connections', {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` },
  })

  const tenants = await tenantsRes.json()
  const tenant = tenants[0] // Use first org for v1

  // Save connection
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const { error } = await supabase.from('connections').upsert({
    user_id: user.id,
    provider: 'xero',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    tenant_id: tenant.tenantId,
    tenant_name: tenant.tenantName,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id',
    ignoreDuplicates: false,
  })

  if (error) {
    console.error('Failed to save Xero connection:', error)
    return NextResponse.redirect(`${origin}/onboarding/connect?error=save_failed`)
  }

  // Trigger initial sync
  await fetch(`${origin}/api/xero/sync`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
    body: JSON.stringify({ user_id: user.id }),
  })

  return NextResponse.redirect(`${origin}/onboarding/found`)
}
