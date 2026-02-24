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
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any = {}
  try { body = await request.json() } catch {}

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

      // Fetch ALL outstanding invoices (not just overdue)
      const invoicesRes = await fetch(
        `https://api.xero.com/api.xro/2.0/Invoices?Statuses=AUTHORISED&where=Type=="ACCREC"&&AmountDue>0`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Xero-Tenant-Id': connection.tenant_id,
            'Accept': 'application/json',
          },
        }
      )

      if (!invoicesRes.ok) {
        const errText = await invoicesRes.text()
        console.error(`Xero API error for connection ${connection.id}:`, errText)
        continue
      }

      const data = await invoicesRes.json()
      const xeroInvoices = data.Invoices || []

      console.log(`Xero returned ${xeroInvoices.length} outstanding invoices for ${connection.tenant_name}`)

      for (const inv of xeroInvoices) {
        const dueDate = inv.DueDateString || inv.DueDate?.split('T')[0]
        const isOverdue = new Date(dueDate) < new Date()

        console.log(`Invoice ${inv.InvoiceNumber}: Due ${dueDate}, Amount £${inv.AmountDue}, Overdue: ${isOverdue}, Contact: ${inv.Contact?.Name}`)

        if (!isOverdue) continue // Only track overdue invoices

        const { error: upsertError } = await supabaseAdmin.from('invoices').upsert({
          user_id: connection.user_id,
          connection_id: connection.id,
          external_id: inv.InvoiceID,
          invoice_number: inv.InvoiceNumber,
          contact_name: inv.Contact?.Name || 'Unknown',
          contact_email: inv.Contact?.EmailAddress || null,
          amount_due: inv.AmountDue,
          currency: inv.CurrencyCode || 'GBP',
          due_date: dueDate,
          chasing_enabled: inv.Contact?.EmailAddress ? true : false,
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'connection_id,external_id',
        })

        if (upsertError) {
          console.error(`Failed to upsert invoice ${inv.InvoiceNumber}:`, upsertError)
        }
      }

      // Check for paid invoices we were tracking
      const { data: trackedInvoices } = await supabaseAdmin
        .from('invoices')
        .select('id, external_id, amount_due, status')
        .eq('connection_id', connection.id)
        .eq('status', 'open')

      if (trackedInvoices && trackedInvoices.length > 0) {
        const paidRes = await fetch(
          `https://api.xero.com/api.xro/2.0/Invoices?Statuses=PAID&where=Type=="ACCREC"`,
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
          const paidIds = new Set((paidData.Invoices || []).map((i: any) => i.InvoiceID))

          for (const tracked of trackedInvoices) {
            if (paidIds.has(tracked.external_id)) {
              await supabaseAdmin.from('invoices').update({
                status: 'paid',
                last_synced_at: new Date().toISOString(),
              }).eq('id', tracked.id)

              await supabaseAdmin.from('chase_emails').update({
                status: 'cancelled',
              }).eq('invoice_id', tracked.id).eq('status', 'scheduled')

              await supabaseAdmin.rpc('increment_recovered', {
                amount: tracked.amount_due,
              })
            }
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
