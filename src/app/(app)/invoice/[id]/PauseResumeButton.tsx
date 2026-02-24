'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function PauseResumeButton({ invoiceId, chasingEnabled }: { invoiceId: string; chasingEnabled: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const endpoint = chasingEnabled ? '/api/invoices/pause' : '/api/invoices/resume'
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        chasingEnabled
          ? 'bg-cream text-muted hover:bg-line hover:text-ink'
          : 'bg-ink text-paper hover:bg-ink-2'
      }`}
    >
      {loading ? '...' : chasingEnabled ? 'Pause chasing' : 'Resume chasing'}
    </button>
  )
}
