import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(`${origin}/onboarding/connect?error=no_code`)
  }

  // CSRF: validate state parameter
  const storedState = cookies().get('xero_oauth_state')?.value
  cookies().delete('xero_oauth_state')

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/onboarding/connect?error=invalid_state`)
  }

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

  const tenantsRes = await fetch('https://api.xero.com/connections', {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` },
  })

  const tenants = await tenantsRes.json()
  const tenant = tenants[0]

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Check if connection already exists
  const { data: existing } = await supabase
    .from('connections')
    .select('id')
    .eq('user_id', user.id)
    .eq('provider', 'xero')
    .single()

  let saveError

  if (existing) {
    const { error } = await supabase.from('connections').update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      tenant_id: tenant.tenantId,
      tenant_name: tenant.tenantName,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id)
    saveError = error
  } else {
    const { error } = await supabase.from('connections').insert({
      user_id: user.id,
      provider: 'xero',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      tenant_id: tenant.tenantId,
      tenant_name: tenant.tenantName,
    })
    saveError = error
  }

  if (saveError) {
    console.error('Failed to save Xero connection:', saveError)
    return NextResponse.redirect(`${origin}/onboarding/connect?error=save_failed`)
  }

  // Trigger initial sync
  try {
    await fetch(`${origin}/api/xero/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({ user_id: user.id }),
    })
  } catch (e) {
    console.error('Initial sync failed:', e)
  }

  return NextResponse.redirect(`${origin}/onboarding/found`)
}
