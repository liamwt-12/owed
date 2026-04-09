import { supabaseAdmin } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function requireAdmin(): NextResponse | null {
  const session = cookies().get('admin_session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET() {
  const authError = requireAdmin()
  if (authError) return authError

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1).toISOString() // Monday

  // Run all queries in parallel
  const [
    totalUsers,
    newThisWeek,
    newToday,
    totalConnections,
    activeConnections,
    chasingOpen,
    chasingPaused,
    chasingPaid,
    chaseEmailsThisWeek,
    chaseEmailsTotal,
    totalRecovered,
    usersWithRecovery,
    accountantLeadsCount,
    accountantLeadsRecent,
    subsActive,
    subsTrialing,
    subsExpired,
  ] = await Promise.all([
    // SIGNUPS
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),

    // CONNECTIONS
    supabaseAdmin.from('connections').select('*', { count: 'exact', head: true }).is('disconnected_at', null),
    supabaseAdmin.from('connections').select('*', { count: 'exact', head: true }).is('disconnected_at', null).eq('token_expired', false),

    // CHASING
    supabaseAdmin.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'open').eq('chasing_enabled', true),
    supabaseAdmin.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'paused'),
    supabaseAdmin.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabaseAdmin.from('chase_emails').select('*', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', startOfWeek),
    supabaseAdmin.from('chase_emails').select('*', { count: 'exact', head: true }).eq('status', 'sent'),

    // RECOVERY
    supabaseAdmin.from('profiles').select('total_recovered'),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gt('total_recovered', 0),

    // ACCOUNTANT LEADS
    supabaseAdmin.from('accountant_leads').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('accountant_leads').select('name, practice_name, email, client_estimate, created_at').order('created_at', { ascending: false }).limit(10),

    // SUBSCRIPTIONS
    supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'trialing'),
    supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).not('status', 'in', '("active","trialing")'),
  ])

  // Sum total recovered
  const recoveredSum = (totalRecovered.data || []).reduce(
    (sum: number, row: { total_recovered: number }) => sum + Number(row.total_recovered || 0),
    0
  )

  return NextResponse.json({
    signups: {
      total: totalUsers.count ?? 0,
      thisWeek: newThisWeek.count ?? 0,
      today: newToday.count ?? 0,
    },
    connections: {
      total: totalConnections.count ?? 0,
      active: activeConnections.count ?? 0,
    },
    chasing: {
      open: chasingOpen.count ?? 0,
      paused: chasingPaused.count ?? 0,
      paid: chasingPaid.count ?? 0,
      emailsThisWeek: chaseEmailsThisWeek.count ?? 0,
      emailsTotal: chaseEmailsTotal.count ?? 0,
    },
    recovery: {
      totalRecovered: recoveredSum,
      usersWithRecovery: usersWithRecovery.count ?? 0,
    },
    accountantLeads: {
      total: accountantLeadsCount.count ?? 0,
      recent: accountantLeadsRecent.data ?? [],
    },
    subscriptions: {
      active: subsActive.count ?? 0,
      trialing: subsTrialing.count ?? 0,
      expired: subsExpired.count ?? 0,
    },
    timestamp: now.toISOString(),
  })
}
