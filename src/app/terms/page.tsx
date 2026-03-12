import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Owed',
}

export default function TermsPage() {
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
        <h1 className="font-syne font-extrabold text-3xl text-ink tracking-tight mb-3">Terms of Service</h1>
        <p className="text-xs text-faint mb-10">Last updated: March 2026</p>

        <div className="text-[15px] text-muted leading-relaxed space-y-8">
          <section>
            <h2 className="text-ink font-semibold text-base mb-2">What Owed does</h2>
            <p>Owed is an automated invoice chasing tool that connects to your Xero accounting software, identifies overdue sales invoices, and sends a sequence of professional reminder emails to your clients on your behalf. We are not a debt collection agency, a legal service, or a financial adviser.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Eligibility</h2>
            <p>Owed is currently available to UK businesses only. You must be a Xero user with a valid Xero organisation. You must be 18 years of age or older and have the authority to connect the Xero organisation you link to Owed.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Your account</h2>
            <p>You are responsible for keeping your login credentials secure and for all activity under your account. You must provide accurate business information. If you suspect unauthorised access, contact us immediately at <a href="mailto:support@owedhq.com" className="text-ink underline">support@owedhq.com</a>.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Subscription and billing</h2>
            <p>Owed costs &pound;29 per month, billed monthly via Stripe. New accounts receive a 14-day free trial with full access to all features. No credit card is required to start your trial. You can cancel at any time — your access continues until the end of your current billing period. We do not offer refunds for partial months.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">5x Recovery Promise</h2>
            <p className="mb-2">If you recover less than &pound;435 in your first 90 days of a paid subscription, we&apos;ll apply 3 months of free credit to your account automatically.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The promise applies to users with at least &pound;500 in overdue invoices at the time of signup.</li>
              <li>Credit is applied as a Stripe balance credit, not cash.</li>
              <li>One promise per customer.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Acceptable use</h2>
            <p className="mb-2">You agree to use Owed only to chase your own legitimate invoices. You must not:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the service to harass, threaten, or intimidate anyone.</li>
              <li>Chase invoices for work you did not perform or goods you did not supply.</li>
              <li>Send emails to contacts who have not done business with you.</li>
              <li>Provide false or misleading business information.</li>
            </ul>
            <p className="mt-2">You must ensure you have the right to send emails to the client contacts stored in your Xero account.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Email sending</h2>
            <p>By using Owed, you authorise us to send emails to your clients on your behalf. Chase emails are sent from accounts@owedhq.com with your email as the reply-to address. You remain responsible for the accuracy of contact information in your Xero account. You can pause or stop chasing any invoice at any time.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Data and privacy</h2>
            <p>How we collect, use, and protect your data is covered in our <Link href="/privacy" className="text-ink underline">Privacy Policy</Link>.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Xero connection</h2>
            <p>You grant us read-only access to your Xero sales invoices and contacts. We never modify your accounting data. You can disconnect Xero at any time from your Settings page.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Limitation of liability</h2>
            <p>We make reasonable efforts to deliver chase emails reliably and on schedule. However, we are not liable for failed email delivery, disputes between you and your clients, or the outcomes of the chase process. Email delivery depends on third-party infrastructure and we cannot guarantee inbox placement.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Termination</h2>
            <p>Either party can terminate at any time. You can cancel your subscription from Settings or by contacting <a href="mailto:support@owedhq.com" className="text-ink underline">support@owedhq.com</a>. We may suspend or terminate accounts that violate these terms, use the service to harass or threaten, or attempt to abuse the platform.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Changes to terms</h2>
            <p>We may update these terms from time to time. We will notify you of significant changes by email with at least 30 days notice. Continued use of Owed after changes take effect constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-ink font-semibold text-base mb-2">Governing law</h2>
            <p>These terms are governed by the laws of England and Wales.</p>
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
