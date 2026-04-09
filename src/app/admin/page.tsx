'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Stats {
  signups: { total: number; thisWeek: number; today: number }
  connections: { total: number; active: number }
  chasing: { open: number; paused: number; paid: number; emailsThisWeek: number; emailsTotal: number }
  recovery: { totalRecovered: number; usersWithRecovery: number }
  accountantLeads: {
    total: number
    recent: { name: string; practice_name: string; email: string; client_estimate: string; created_at: string }[]
  }
  subscriptions: { active: number; trialing: number; expired: number }
  timestamp: string
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-line rounded-xl p-5">
      <div className="text-sm text-muted font-medium mb-1">{label}</div>
      <div className="text-2xl font-syne font-extrabold tracking-tight text-ink">{value}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[1.2px] text-faint mt-10 mb-4 first:mt-0">
      {children}
    </h2>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState(false)
  const router = useRouter()

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.status === 401) {
        router.push('/admin/login')
        return
      }
      if (!res.ok) throw new Error()
      setStats(await res.json())
      setError(false)
    } catch {
      setError(true)
    }
  }, [router])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  if (!stats && !error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-muted text-sm">Loading dashboard...</p>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-pop text-sm font-medium">Failed to load stats. Check your connection.</p>
      </div>
    )
  }

  const s = stats!

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pop" />
            <span className="font-syne font-extrabold text-lg tracking-tight text-ink">owed</span>
            <span className="text-xs text-muted ml-2 font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-faint hidden sm:block">
              Updated {new Date(s.timestamp).toLocaleTimeString('en-GB')}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-muted hover:text-ink font-medium transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">
        {error && (
          <div className="mb-6 p-3 bg-pop-pale text-pop text-sm rounded-lg font-medium">
            Failed to refresh — showing last data.
          </div>
        )}

        {/* SIGNUPS */}
        <SectionTitle>Signups</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total users" value={s.signups.total} />
          <Stat label="New this week" value={s.signups.thisWeek} />
          <Stat label="New today" value={s.signups.today} />
        </div>

        {/* CONNECTIONS */}
        <SectionTitle>Connections</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total Xero connections" value={s.connections.total} />
          <Stat label="Active (token valid)" value={s.connections.active} />
        </div>

        {/* CHASING */}
        <SectionTitle>Chasing</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Stat label="Being chased" value={s.chasing.open} />
          <Stat label="Paused" value={s.chasing.paused} />
          <Stat label="Paid" value={s.chasing.paid} />
          <Stat label="Emails this week" value={s.chasing.emailsThisWeek} />
          <Stat label="Emails total" value={s.chasing.emailsTotal} />
        </div>

        {/* RECOVERY */}
        <SectionTitle>Recovery</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Total recovered"
            value={`\u00a3${Number(s.recovery.totalRecovered).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
          />
          <Stat label="Users with recovery" value={s.recovery.usersWithRecovery} />
        </div>

        {/* SUBSCRIPTIONS */}
        <SectionTitle>Subscriptions</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Active paying" value={s.subscriptions.active} />
          <Stat label="Trialing" value={s.subscriptions.trialing} />
          <Stat label="Expired / cancelled" value={s.subscriptions.expired} />
        </div>

        {/* ACCOUNTANT LEADS */}
        <SectionTitle>Accountant Leads</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat label="Total submissions" value={s.accountantLeads.total} />
        </div>

        {s.accountantLeads.recent.length > 0 && (
          <div className="bg-white border border-line rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-line">
              <span className="text-sm font-semibold text-ink">Recent submissions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-5 py-2.5 font-semibold text-muted text-xs uppercase tracking-wide">Name</th>
                    <th className="px-5 py-2.5 font-semibold text-muted text-xs uppercase tracking-wide">Practice</th>
                    <th className="px-5 py-2.5 font-semibold text-muted text-xs uppercase tracking-wide">Email</th>
                    <th className="px-5 py-2.5 font-semibold text-muted text-xs uppercase tracking-wide">Clients</th>
                    <th className="px-5 py-2.5 font-semibold text-muted text-xs uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {s.accountantLeads.recent.map((lead, i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      <td className="px-5 py-3 text-ink font-medium">{lead.name}</td>
                      <td className="px-5 py-3 text-ink-2">{lead.practice_name}</td>
                      <td className="px-5 py-3 text-ink-2">{lead.email}</td>
                      <td className="px-5 py-3 text-ink-2">{lead.client_estimate}</td>
                      <td className="px-5 py-3 text-muted whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
