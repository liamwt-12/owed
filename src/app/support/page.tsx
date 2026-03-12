import Link from 'next/link'

export const metadata = {
  title: 'Support — Owed',
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <nav className="border-b border-line px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-syne font-extrabold text-lg text-ink flex items-center gap-2">
          <span className="w-2 h-2 bg-pop rounded-full" />
          owed
        </Link>
        <Link href="/login" className="text-sm text-muted hover:text-ink transition-colors">
          Log in
        </Link>
      </nav>

      <main className="flex-1 max-w-[640px] mx-auto px-6 py-16">
        <h1 className="font-syne font-extrabold text-3xl text-ink tracking-tight mb-3">We&apos;re here to help</h1>
        <p className="text-[15px] text-muted leading-relaxed mb-10">
          Owed is built by a small team. If something&apos;s not working or you have a question, we&apos;ll get back to you within one business day.
        </p>

        <a
          href="mailto:support@owedhq.com"
          className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper font-semibold text-[15px] rounded-lg hover:bg-ink-2 transition-colors mb-14"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          Email support@owedhq.com
        </a>

        <h2 className="font-syne font-bold text-xl text-ink tracking-tight mb-6">Common questions</h2>

        <div className="space-y-6">
          <div className="border border-line rounded-lg p-5">
            <h3 className="text-ink font-semibold text-[15px] mb-2">How do I connect my Xero account?</h3>
            <p className="text-muted text-sm leading-relaxed">
              Go to Settings, then Connections, and click Connect Xero. You&apos;ll be redirected to Xero to authorise read-only access to your invoices. Once connected, Owed will sync your overdue invoices automatically.
            </p>
          </div>

          <div className="border border-line rounded-lg p-5">
            <h3 className="text-ink font-semibold text-[15px] mb-2">When are chase emails sent?</h3>
            <p className="text-muted text-sm leading-relaxed">
              The system checks daily at 8am UTC. Emails go out at Day 1, 7, 14, and 21 after the invoice due date. You can see the full schedule for each invoice on your dashboard.
            </p>
          </div>

          <div className="border border-line rounded-lg p-5">
            <h3 className="text-ink font-semibold text-[15px] mb-2">How do I pause chasing on a specific invoice?</h3>
            <p className="text-muted text-sm leading-relaxed">
              Open the invoice from your dashboard and click Pause. The chase sequence will stop immediately. You can resume at any time — chasing will pick up where it left off.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-line px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-faint">
        <span>&copy; 2026 Owed</span>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
          <Link href="/support" className="hover:text-ink transition-colors">Support</Link>
        </div>
      </footer>
    </div>
  )
}
