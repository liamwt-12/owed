'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SyncButton() {
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle')
  const router = useRouter()

  async function handleSync() {
    setSyncing(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/xero/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Sync failed')
      setStatus('done')
      router.refresh()
    } catch {
      setStatus('error')
    } finally {
      setSyncing(false)
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cream text-muted hover:bg-line hover:text-ink transition-colors"
    >
      {syncing ? 'Syncing...' : status === 'done' ? 'Synced' : status === 'error' ? 'Sync failed' : 'Sync now'}
    </button>
  )
}
