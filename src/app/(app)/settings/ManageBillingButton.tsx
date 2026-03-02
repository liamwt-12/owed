'use client'

import { useState } from 'react'

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 bg-ink text-paper text-sm font-semibold rounded-lg hover:bg-ink-2 transition-colors disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Manage subscription'}
    </button>
  )
}
