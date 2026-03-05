'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddEmailForm({ invoiceId }: { invoiceId: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/invoices/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId, email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-pale border border-green/20 rounded-xl p-4 mb-4">
        <p className="text-sm font-medium text-green">Email saved — chasing will start on the next run.</p>
      </div>
    )
  }

  return (
    <div className="bg-pop-pale border border-pop/20 rounded-xl p-4 mb-4">
      <p className="text-sm font-medium text-ink mb-1">We couldn&apos;t find an email for this client.</p>
      <p className="text-xs text-muted mb-3">Add their email below and we&apos;ll start chasing automatically.</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="client@example.com"
          className="flex-1 px-3 py-2 bg-white border border-line rounded-lg text-sm text-ink outline-none focus:border-ink transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-ink text-white text-sm font-semibold rounded-lg hover:bg-ink/90 transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? 'Saving...' : 'Save & start chasing'}
        </button>
      </form>
      {error && <p className="text-pop text-xs mt-2">{error}</p>}
    </div>
  )
}
