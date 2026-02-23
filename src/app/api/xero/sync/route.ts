import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function refreshTokenIfNeeded(connection: any) {
  const expiresAt = new Date(connection.token_expires_at)
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)

  if (expiresAt > fiveMinutesFromNow) {
    return connection.access_token
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
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token,
    }),
  })

  if (!tokenRes.ok) {
    throw new Error('Token refresh failed')
  }

  const tokens = await tokenRes.json()

  await supabaseAdmin.from('connections').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', connection.id)

  return tokens.access_token
}

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any = {}
  try { body = await request.json() } catch {}

  // If user_id provided, sync just that user. Otherwise sync all.
  const query = supabaseAdmin
    .from('connections')
    .select('*')
    .eq('provider', 'xero')

  if (body.user_id) {
    query.eq('user_id', body.user_id)
  }

  const { data: connections, error } = await query
  if (error || !connections) {
    return NextResponse.json({ error: 'No connections found' }, { status: 404 })
  }

  let synced = 0

  for (const connection of connections) {
    try {
      const accessToken = await refreshTokenIfNeeded(connection)
      const today = new Date().toISOString().split('T')[0]

      const invoicesRes = await fetch(
        `https://api.xero.com/api.xro/2.0/Invoices?Type=ACCREC&Statuses=AUTHORISED,SUBMITTED&where=DueDate<DateTime(${today})&summaryOnly=false`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Xero-Tenant-Id': connection.tenant_id,
            'Accept': 'application/json',
          },
        }
      )

      if (!invoicesRes.ok) {
        console.error(`Xero API error for connection ${connection.id}:`, await invoicesRes.text())
        continue
      }

      const data = await invoicesRes.json()
      const xeroInvoices = data.Invoices || []

      for (const inv of xeroInvoices) {
        await supabaseAdmin.from('invoices').upsert({
          user_id: connection.user_id,
          connection_id: connection.id,
          external_id: inv.InvoiceID,
          invoice_number: inv.InvoiceNumber,
          contact_name: inv.Contact?.Name || 'Unknown',
          contact_email: inv.Contact?.EmailAddress || null,
          amount_due: inv.AmountDue,
          currency: inv.CurrencyCode || 'GBP',
          due_date: inv.DueDate?.split('T')[0],
          chasing_enabled: inv.Contact?.EmailAddress ? true : false,
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'connection_id,external_id',
        })
      }

      // Check for paid invoices
      const paidRes = await fetch(
        `https://api.xero.com/api.xro/2.0/Invoices?Type=ACCREC&Statuses=PAID`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Xero-Tenant-Id': connection.tenant_id,
            'Accept': 'application/json',
          },
        }
      )

      if (paidRes.ok) {
        const paidData = await paidRes.json()
        const paidInvoices = paidData.Invoices || []

        for (const inv of paidInvoices) {
          // Update invoice status if we were tracking it
          const { data: existing } = await supabaseAdmin
            .from('invoices')
            .select('id, amount_due, status')
            .eq('connection_id', connection.id)
            .eq('external_id', inv.InvoiceID)
            .eq('status', 'open')
            .single()

          if (existing) {
            await supabaseAdmin.from('invoices').update({
              status: 'paid',
              last_synced_at: new Date().toISOString(),
            }).eq('id', existing.id)

            // Cancel pending chase emails
            await supabaseAdmin.from('chase_emails').update({
              status: 'cancelled',
            }).eq('invoice_id', existing.id).eq('status', 'scheduled')

            // Increment platform stats
            await supabaseAdmin.rpc('increment_recovered', {
              amount: existing.amount_due,
            })
          }
        }
      }

      synced++
    } catch (err) {
      console.error(`Sync error for connection ${connection.id}:`, err)
    }
  }

  return NextResponse.json({ synced, total: connections.length })
}
