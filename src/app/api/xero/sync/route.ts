import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function refreshTokenIfNeeded(connection: any): Promise<string | null> {
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
    console.error(`Token refresh failed for connection ${connection.id}:`, await tokenRes.text())
    // Mark connection as needing reconnection
    await supabaseAdmin.from('connections').update({
      token_expired: true,
      updated_at: new Date().toISOString(),
    }).eq('id', connection.id)
    return null
  }

  const tokens = await tokenRes.json()

  await supabaseAdmin.from('connections').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    token_expired: false,
    updated_at: new Date().toISOString(),
  }).eq('id', connection.id)

  return tokens.access_token
}

function extractPhone(contact: any): string | null {
  if (!contact?.Phones) return null
  for (const phone of contact.Phones) {
    const number = [phone.PhoneCountryCode, phone.PhoneAreaCode, phone.PhoneNumber]
      .filter(Boolean).join(' ').trim()
    if (number) return number
  }
  return null
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET

  let body: any = {}
  try { body = await request.json() } catch {}

  // Allow authenticated users to sync their own data
  if (!isCron) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    body.user_id = user.id
  }

  const query = supabaseAdmin
    .from('connections')
    .select('*')
    .eq('provider', 'xero')
    .is('disconnected_at', null)

  if (body.user_id) {
    query.eq('user_id', body.user_id)
  }

  const { data: connections, error } = await query
  if (error || !connections) {
    return NextResponse.json({ error: 'No connections found' }, { status: 404 })
  }

  let synced = 0
  let newPaid = 0

  for (const connection of connections) {
    try {
      const accessToken = await refreshTokenIfNeeded(connection)

      if (!accessToken) {
        console.log(`Skipping connection ${connection.id}: token expired, needs reconnection`)
        continue
      }

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
        console.error(`Xero API error for connection ${connection.id}:`, await invoicesRes.text())
        continue
      }

      const data = await invoicesRes.json()
      const xeroInvoices = data.Invoices || []

      console.log(`Xero returned ${xeroInvoices.length} outstanding invoices for ${connection.tenant_name}`)

      for (const inv of xeroInvoices) {
        const dueDate = inv.DueDateString || inv.DueDate?.split('T')[0]
        const isOverdue = new Date(dueDate) < new Date()

        if (!isOverdue) continue

        const contactPhone = extractPhone(inv.Contact)

        // Check if invoice already exists (to avoid overwriting chasing_enabled)
        const { data: existingInv } = await supabaseAdmin
          .from('invoices')
          .select('id')
          .eq('connection_id', connection.id)
          .eq('external_id', inv.InvoiceID)
          .single()

        const invoiceData: any = {
          user_id: connection.user_id,
          connection_id: connection.id,
          external_id: inv.InvoiceID,
          invoice_number: inv.InvoiceNumber,
          contact_name: inv.Contact?.Name || 'Unknown',
          contact_email: inv.Contact?.EmailAddress || null,
          contact_phone: contactPhone,
          amount_due: inv.AmountDue,
          currency: inv.CurrencyCode || 'GBP',
          due_date: dueDate,
          last_synced_at: new Date().toISOString(),
        }

        // Only set chasing_enabled on first insert
        if (!existingInv) {
          invoiceData.chasing_enabled = !!inv.Contact?.EmailAddress
        }

        const { error: upsertError } = await supabaseAdmin.from('invoices').upsert(invoiceData, {
          onConflict: 'connection_id,external_id',
        })

        if (upsertError) {
          console.error(`Failed to upsert invoice ${inv.InvoiceNumber}:`, upsertError)
        }
      }

      // Detect paid invoices
      const { data: trackedInvoices } = await supabaseAdmin
        .from('invoices')
        .select('id, external_id, amount_due, status, user_id')
        .eq('connection_id', connection.id)
        .eq('status', 'open')

      if (trackedInvoices && trackedInvoices.length > 0) {
        // Check for paid invoices
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

        // Check for voided invoices
        const voidedRes = await fetch(
          `https://api.xero.com/api.xro/2.0/Invoices?Statuses=VOIDED&where=Type=="ACCREC"`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Xero-Tenant-Id': connection.tenant_id,
              'Accept': 'application/json',
            },
          }
        )

        const paidIds = new Set<string>()
        const voidedIds = new Set<string>()

        if (paidRes.ok) {
          const paidData = await paidRes.json()
          for (const i of (paidData.Invoices || [])) paidIds.add(i.InvoiceID)
        }

        if (voidedRes.ok) {
          const voidedData = await voidedRes.json()
          for (const i of (voidedData.Invoices || [])) voidedIds.add(i.InvoiceID)
        }

        for (const tracked of trackedInvoices) {
          const isPaid = paidIds.has(tracked.external_id)
          const isVoided = voidedIds.has(tracked.external_id)

          if (isPaid || isVoided) {
            const newStatus = isPaid ? 'paid' : 'voided'

            await supabaseAdmin.from('invoices').update({
              status: newStatus,
              chasing_enabled: false,
              last_synced_at: new Date().toISOString(),
            }).eq('id', tracked.id)

            await supabaseAdmin.from('chase_emails').update({
              status: 'cancelled',
            }).eq('invoice_id', tracked.id).eq('status', 'scheduled')

            await supabaseAdmin.from('invoice_activity').insert({
              invoice_id: tracked.id,
              user_id: tracked.user_id,
              type: newStatus,
              note: `${isPaid ? 'Payment' : 'Voided'} detected via Xero sync`,
            })

            if (isPaid) {
              try {
                await supabaseAdmin.rpc('increment_recovered', {
                  amount: tracked.amount_due,
                })
              } catch (e) {
                console.error('Failed to increment recovery:', e)
              }
              newPaid++
            }
          }
        }
      }

      synced++
    } catch (err) {
      console.error(`Sync error for connection ${connection.id}:`, err)
    }
  }

  return NextResponse.json({ synced, total: connections.length, newPaid })
}
