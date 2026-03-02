'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function StartChasingButton({ count }: { count: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleStart() {
    setLoading(true)
    await fetch('/api/welcome/start-chasing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    router.push('/dashboard')
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-paper font-semibold text-[16px] rounded-xl hover:bg-ink-2 transition-colors disabled:opacity-60"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Starting...
        </>
      ) : (
        <>
          Start chasing all {count} invoices
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </>
      )}
    </button>
  )
}
