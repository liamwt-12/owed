import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { invoice_id, email } = body

  if (!invoice_id || !email) {
    return NextResponse.json({ error: 'Missing invoice_id or email' }, { status: 400 })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  // Verify the invoice belongs to the user
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, user_id')
    .eq('id', invoice_id)
    .eq('user_id', user.id)
    .single()

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  // Update the invoice with the email and enable chasing
  const { error } = await supabase
    .from('invoices')
    .update({
      contact_email: email,
      chasing_enabled: true,
    })
    .eq('id', invoice_id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
