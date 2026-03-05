'use client'

import { useState } from 'react'

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full py-3 px-6 bg-ink text-white text-sm font-semibold rounded-lg hover:bg-ink/90 transition-colors mb-3 disabled:opacity-60"
    >
      {loading ? 'Redirecting to checkout...' : 'Upgrade now — £29/month'}
    </button>
  )
}
