'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function TheyRepliedButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    await fetch('/api/invoices/replied', {
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
      className="w-full mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-amber-pale border border-amber/20 text-ink hover:border-amber/40 transition-colors text-left"
    >
      <span className="font-semibold">Did they reply?</span>
      <span className="text-muted ml-1">{loading ? 'Pausing...' : 'Pause chasing while you sort it out.'}</span>
    </button>
  )
}
