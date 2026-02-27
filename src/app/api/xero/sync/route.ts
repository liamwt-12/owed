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

async function fetchAllXeroInvoices(
  baseUrl: string,
  accessToken: string,
  tenantId: string,
): Promise<any[]> {
  const all: any[] = []
  let page = 1

  while (true) {
    const separator = baseUrl.includes('?') ? '&' : '?'
    const res = await fetch(`${baseUrl}${separator}page=${page}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Xero-Tenant-Id': tenantId,
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      if (page === 1) throw new Error(`Xero API error: ${res.status}`)
      break
    }

    const data = await res.json()
    const invoices = data.Invoices || []
    all.push(...invoices)

    if (invoices.length < 100) break
    page++
  }

  return all
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

  // Pre-fetch user emails for payment notifications
  const userEmails: Record<string, string> = {}

  for (const connection of connections) {
    try {
      const accessToken = await refreshTokenIfNeeded(connection)

      if (!accessToken) {
        console.log(`Skipping connection ${connection.id}: token expired, needs reconnection`)
        continue
      }

      let xeroInvoices: any[]
      try {
        xeroInvoices = await fetchAllXeroInvoices(
          `https://api.xero.com/api.xro/2.0/Invoices?Statuses=AUTHORISED&where=Type=="ACCREC"&&AmountDue>0`,
          accessToken,
          connection.tenant_id,
        )
      } catch (e) {
        console.error(`Xero API error for connection ${connection.id}:`, e)
        continue
      }

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
        .select('id, external_id, amount_due, invoice_number, contact_name, status, user_id')
        .eq('connection_id', connection.id)
        .eq('status', 'open')

      if (trackedInvoices && trackedInvoices.length > 0) {
        const paidIds = new Set<string>()
        const voidedIds = new Set<string>()

        try {
          const paidInvoices = await fetchAllXeroInvoices(
            `https://api.xero.com/api.xro/2.0/Invoices?Statuses=PAID&where=Type=="ACCREC"`,
            accessToken,
            connection.tenant_id,
          )
          for (const i of paidInvoices) paidIds.add(i.InvoiceID)
        } catch (e) {
          console.error(`Failed to fetch paid invoices for ${connection.id}:`, e)
        }

        try {
          const voidedInvoices = await fetchAllXeroInvoices(
            `https://api.xero.com/api.xro/2.0/Invoices?Statuses=VOIDED&where=Type=="ACCREC"`,
            accessToken,
            connection.tenant_id,
          )
          for (const i of voidedInvoices) voidedIds.add(i.InvoiceID)
        } catch (e) {
          console.error(`Failed to fetch voided invoices for ${connection.id}:`, e)
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

              // Send payment notification email to user
              try {
                if (!userEmails[tracked.user_id]) {
                  const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('email')
                    .eq('id', tracked.user_id)
                    .single()
                  if (profile) userEmails[tracked.user_id] = profile.email
                }
                const userEmail = userEmails[tracked.user_id]
                if (userEmail) {
                  const paidAmount = `\u00a3${Number(tracked.amount_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                  const invNumber = tracked.invoice_number || 'an invoice'
                  await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      from: process.env.RESEND_FROM_EMAIL || 'accounts@owedhq.com',
                      to: userEmail,
                      subject: `Invoice ${invNumber} has been paid`,
                      html: `<p>Good news — Invoice #${invNumber} for ${paidAmount} to ${tracked.contact_name || 'your client'} has been paid.</p>
<p>We detected the payment via Xero and have stopped all chase emails for this invoice.</p>
<p style="margin-top:24px">— Owed</p>
<p style="color:#999;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">Payment notification from Owed · <a href="https://owedhq.com/dashboard" style="color:#999">View dashboard</a></p>`,
                    }),
                  })
                }
              } catch (e) {
                console.error('Failed to send payment notification:', e)
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
