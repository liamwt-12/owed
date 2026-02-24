'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await fetch('/api/invoices/mark-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId }),
    })
    router.refresh()
    setLoading(false)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">Mark as paid?</span>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-3 py-1.5 bg-green text-white rounded-lg text-sm font-semibold hover:bg-green/90 transition-colors"
        >
          {loading ? '...' : 'Yes, paid'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 text-sm text-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-pale text-green hover:bg-green/10 transition-colors"
    >
      Mark as paid
    </button>
  )
}
