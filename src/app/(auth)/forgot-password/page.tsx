'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-10">
          <Link href="/" className="font-syne font-extrabold text-xl text-ink flex items-center gap-2">
            <span className="w-2 h-2 bg-pop rounded-full" />
            owed
          </Link>
        </div>

        <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-2">
          Reset your password
        </h1>
        <p className="text-muted text-[15px] mb-8">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div>
            <p className="text-ink text-[15px] mb-6">
              Check your email for a reset link.
            </p>
            <Link href="/login" className="text-ink font-medium text-sm hover:underline">
              &larr; Back to login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-line rounded-lg text-ink text-[15px] outline-none focus:border-ink transition-colors"
                  placeholder="you@business.co.uk"
                />
              </div>

              {error && (
                <p className="text-pop text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-ink text-paper font-semibold text-[15px] rounded-lg hover:bg-ink-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className="text-muted text-sm mt-6 text-center">
              <Link href="/login" className="text-ink font-medium hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
