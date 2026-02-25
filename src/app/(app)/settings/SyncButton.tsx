'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SyncButton() {
  const [syncing, setSyncing] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleSync() {
    setSyncing(true)
    await fetch('/api/xero/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setSyncing(false)
    setDone(true)
    router.refresh()
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cream text-muted hover:bg-line hover:text-ink transition-colors"
    >
      {syncing ? 'Syncing...' : done ? 'Synced' : 'Sync now'}
    </button>
  )
}
