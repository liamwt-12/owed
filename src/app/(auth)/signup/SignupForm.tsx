'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()
  const isBeta = searchParams.get('beta') === 'OWED2026'
  const isPartner = searchParams.get('partner') === 'true'
  const refCode = searchParams.get('ref')

  // Set cookies on mount so they persist through Xero SSO redirect flow
  useEffect(() => {
    if (isPartner) {
      document.cookie = 'owed_partner=true; path=/; max-age=3600; SameSite=Lax'
    }
    if (refCode) {
      document.cookie = `owed_ref=${refCode}; path=/; max-age=3600; SameSite=Lax`
    }
  }, [isPartner, refCode])

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
      if (isBeta) {
        document.cookie = 'owed_beta=OWED2026; path=/; max-age=3600; SameSite=Lax'
      }
      if (isPartner) {
        document.cookie = 'owed_partner=true; path=/; max-age=3600; SameSite=Lax'
      }
      if (refCode) {
        document.cookie = `owed_ref=${refCode}; path=/; max-age=3600; SameSite=Lax`
      }
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
              {isPartner ? 'Become a Founding Partner' : 'Start your free trial'}
            </h1>
            <p className="text-muted text-[15px] mb-3">
              {isPartner ? 'Free for life. No credit card needed.' : refCode ? '30 days free. No credit card needed.' : '14 days free. No credit card needed.'}
            </p>

            {isPartner && (
              <div className="mb-6 px-3 py-2.5 bg-pop-pale border border-pop/15 rounded-lg">
                <p className="text-sm text-pop font-medium">Signing up as an accountant partner</p>
              </div>
            )}
            {refCode && !isPartner && (
              <div className="mb-6 px-3 py-2.5 bg-green-pale border border-green/15 rounded-lg">
                <p className="text-sm text-green font-medium">You&apos;ve been referred — enjoy 30 days free</p>
              </div>
            )}

            <a
              href="/api/auth/xero-sso/connect"
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border-2 border-[#13B5EA] rounded-lg text-[15px] font-semibold text-ink hover:bg-[#f0faff] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="#13B5EA"/>
                <path d="M10.027 10.001l2.934-2.934a.375.375 0 10-.53-.53L9.497 9.471 6.563 6.537a.375.375 0 10-.53.53l2.934 2.934-2.933 2.933a.375.375 0 00.53.53l2.933-2.933 2.934 2.934a.375.375 0 00.53-.53l-2.934-2.934z" fill="white"/>
              </svg>
              Sign up with Xero
            </a>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-line" />
              <span className="text-xs text-faint font-medium">or</span>
              <div className="flex-1 h-px bg-line" />
            </div>

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
