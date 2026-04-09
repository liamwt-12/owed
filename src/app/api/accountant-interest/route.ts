import { supabaseAdmin } from '@/lib/supabase/admin'
import { csrfCheck } from '@/lib/csrf'
import { NextResponse } from 'next/server'

/*
-- SQL: Run this in Supabase SQL Editor to create the accountant_leads table
-- =============================================

create table public.accountant_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  practice_name text not null,
  email text not null,
  client_estimate text not null,
  created_at timestamptz default now()
);

alter table public.accountant_leads enable row level security;

create policy "Allow anonymous inserts to accountant_leads"
  on public.accountant_leads for insert
  with check (true);

-- =============================================
*/

export async function POST(request: Request) {
  const csrfError = csrfCheck(request)
  if (csrfError) return csrfError

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Honeypot check — if website_url is filled, it's a bot
  if (body.website_url) {
    return NextResponse.json({ ok: true })
  }

  const { name, practice_name, email, client_estimate } = body as {
    name: string
    practice_name: string
    email: string
    client_estimate: string
  }

  if (!name || !practice_name || !email || !client_estimate) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  // Insert into Supabase
  const { error: dbError } = await supabaseAdmin
    .from('accountant_leads')
    .insert({ name, practice_name, email, client_estimate })

  if (dbError) {
    console.error('accountant_leads insert error:', dbError)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // Send notification email via Resend
  try {
    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Owed <notifications@owedhq.com>',
        to: 'support@owedhq.com',
        subject: `New accountant interest — ${practice_name}`,
        html: `
          <h2>New accountant interest form submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Practice:</strong> ${practice_name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Client estimate:</strong> ${client_estimate}</p>
          <p><strong>Submitted:</strong> ${timestamp}</p>
        `,
      }),
    })
  } catch (emailError) {
    // Log but don't fail the request — the lead is already saved
    console.error('Resend notification error:', emailError)
  }

  return NextResponse.json({ ok: true })
}
