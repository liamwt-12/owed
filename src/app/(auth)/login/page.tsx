'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
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
          Welcome back
        </h1>
        <p className="text-muted text-[15px] mb-8">
          Log in to check on your invoices.
        </p>

        <a
          href="/api/auth/xero-sso/connect"
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border-2 border-[#13B5EA] rounded-lg text-[15px] font-semibold text-ink hover:bg-[#f0faff] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="10" fill="#13B5EA"/>
            <path d="M10.027 10.001l2.934-2.934a.375.375 0 10-.53-.53L9.497 9.471 6.563 6.537a.375.375 0 10-.53.53l2.934 2.934-2.933 2.933a.375.375 0 00.53.53l2.933-2.933 2.934 2.934a.375.375 0 00.53-.53l-2.934-2.934z" fill="white"/>
          </svg>
          Sign in with Xero
        </a>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-line" />
          <span className="text-xs text-faint font-medium">or</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              className="w-full px-3.5 py-2.5 bg-white border border-line rounded-lg text-ink text-[15px] outline-none focus:border-ink transition-colors"
              placeholder="Your password"
            />
            <div className="mt-1.5 text-right">
              <Link href="/forgot-password" className="text-xs text-muted hover:text-ink transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <p className="text-pop text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-ink text-paper font-semibold text-[15px] rounded-lg hover:bg-ink-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-muted text-sm mt-6 text-center">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-ink font-medium hover:underline">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  )
}
