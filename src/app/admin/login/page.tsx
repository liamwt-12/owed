'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        setError('Wrong password')
        setLoading(false)
        return
      }

      router.push('/admin')
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-pop" />
            <span className="font-syne font-extrabold text-xl tracking-tight text-ink">owed</span>
          </div>
          <p className="text-sm text-muted">Admin access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-line rounded-2xl p-8">
          <label className="block text-sm font-semibold text-ink mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-line rounded-lg bg-paper text-ink font-body text-[15px] focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/5"
            placeholder="Enter admin password"
            autoFocus
            required
          />

          {error && (
            <p className="mt-3 text-sm text-pop font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full bg-ink text-paper py-3 rounded-lg font-semibold text-[15px] hover:bg-ink-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in\u2026' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
