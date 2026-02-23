import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('platform_stats')
    .select('total_recovered, total_invoices_paid')
    .eq('id', 1)
    .single()

  if (error) {
    return NextResponse.json({ total_recovered: 0, total_invoices_paid: 0 })
  }

  return NextResponse.json(data)
}
