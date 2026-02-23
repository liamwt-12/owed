'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
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

        {success ? (
          <div>
            <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-3">
              Check your email
            </h1>
            <p className="text-muted text-[15px] leading-relaxed">
              We&apos;ve sent a confirmation link to <strong className="text-ink">{email}</strong>. Click it to get started.
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-2">
              Start your free trial
            </h1>
            <p className="text-muted text-[15px] mb-8">
              14 days free. No credit card needed.
            </p>

            <form onSubmit={handleSignup} className="space-y-4">
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

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 bg-white border border-line rounded-lg text-ink text-[15px] outline-none focus:border-ink transition-colors"
                  placeholder="At least 8 characters"
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
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="text-muted text-sm mt-6 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-ink font-medium hover:underline">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
