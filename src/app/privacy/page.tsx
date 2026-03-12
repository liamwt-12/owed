import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Owed',
}

export default function PrivacyPage() {
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
        <h1 className="font-syne font-extrabold text-3xl text-ink tracking-tight mb-3">Privacy Policy</h1>
        <p className="text-xs text-faint mb-10">Last updated: March 2026</p>

        <div className="text-[15px] text-muted leading-relaxed space-y-8">
          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Who we are</h2>
            <p>Owed is a trading name of Useful for Humans Ltd. We build tools that help UK small businesses get paid on time. Our website is <a href="https://owedhq.com" className="text-ink underline">owedhq.com</a> and you can reach us at <a href="mailto:support@owedhq.com" className="text-ink underline">support@owedhq.com</a>.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">What data we collect</h2>
            <p className="mb-2">When you use Owed, we collect and store the following:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-ink">Account information:</strong> your name, email address, and business name.</li>
              <li><strong className="text-ink">Invoice data from Xero:</strong> contact names, contact email addresses, invoice amounts, invoice numbers, and due dates. This data is pulled from your Xero account via read-only API access.</li>
              <li><strong className="text-ink">Payment information:</strong> handled entirely by Stripe. We never see or store your card details.</li>
              <li><strong className="text-ink">Usage data:</strong> which features you use, when you log in, and how you interact with the dashboard. This helps us improve the product.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Why we collect it</h2>
            <p className="mb-2">We use your data to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide the invoice chasing service — identifying overdue invoices and sending chase emails on your behalf.</li>
              <li>Send chase emails to your clients at the right times in the right sequence.</li>
              <li>Detect when invoices are paid so we can stop chasing automatically.</li>
              <li>Send you digest and notification emails about your chasing activity.</li>
              <li>Process your subscription payments via Stripe.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Xero data</h2>
            <p>We access your Xero invoices with <strong className="text-ink">read-only</strong> permissions. We never modify your accounting data. We store invoice and contact data in our database to power the chase sequence. We do not share this data with third parties except as required to operate the service (see Third-party services below).</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Chase emails</h2>
            <p>We send emails to your clients on your behalf from accounts@owedhq.com, with your email as the reply-to address. Your clients&apos; email addresses are stored to enable this. Clients can unsubscribe from chase emails, and you can pause or stop chasing any invoice at any time from your dashboard.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Data retention</h2>
            <p>We retain your data for as long as your account is active. If you cancel your account, your data will be deleted within 30 days on request. You can request full data deletion at any time by emailing <a href="mailto:support@owedhq.com" className="text-ink underline">support@owedhq.com</a>.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Third-party services</h2>
            <p className="mb-2">We use the following services to operate Owed:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-ink">Xero</strong> — accounting data access (read-only).</li>
              <li><strong className="text-ink">Stripe</strong> — subscription payments. Stripe handles all card data.</li>
              <li><strong className="text-ink">Resend</strong> — email delivery for chase emails and notifications.</li>
              <li><strong className="text-ink">Supabase</strong> — database hosting (hosted in the EU).</li>
            </ul>
            <p className="mt-2">We do not sell your data or share it with advertisers.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Your rights</h2>
            <p>Under UK GDPR, you have the right to access, correct, or delete your personal data. You can disconnect Xero at any time from your Settings page. To exercise any of these rights, email <a href="mailto:support@owedhq.com" className="text-ink underline">support@owedhq.com</a>.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Cookies</h2>
            <p>We use essential cookies only — for authentication sessions and CSRF protection. We do not use tracking cookies, third-party analytics, or advertising pixels.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Governing law</h2>
            <p>This privacy policy is governed by the laws of England and Wales.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Contact</h2>
            <p>Useful for Humans Ltd &middot; <a href="mailto:support@owedhq.com" className="text-ink underline">support@owedhq.com</a></p>
          </section>
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
