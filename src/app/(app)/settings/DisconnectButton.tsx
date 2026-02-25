'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DisconnectButton() {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDisconnect() {
    setLoading(true)
    await fetch('/api/xero/disconnect', {
      method: 'POST',
    })
    router.refresh()
    setLoading(false)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Disconnect Xero?</span>
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-pop text-white hover:bg-pop/90 transition-colors"
        >
          {loading ? '...' : 'Yes, disconnect'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 text-xs text-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 text-xs font-semibold rounded-lg text-pop hover:bg-pop-pale transition-colors"
    >
      Disconnect
    </button>
  )
}
