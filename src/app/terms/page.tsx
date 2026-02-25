export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-[640px] mx-auto px-6 py-20">
        <h1 className="font-syne font-extrabold text-3xl text-ink tracking-tight mb-8">Terms of Service</h1>
        <div className="text-sm text-muted leading-relaxed space-y-6">
          <p className="text-xs text-faint">Last updated: February 2026</p>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">What Owed does</h2>
            <p>Owed connects to your Xero account, identifies overdue sales invoices, and sends a sequence of professional reminder emails to your clients on your behalf. That&apos;s it. We are not a debt collection agency, a legal service, or a financial advisor.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Your account</h2>
            <p>You must provide a valid email address to create an account. You are responsible for maintaining the security of your account. You must be a UK-based business or sole trader to use Owed. You must have the authority to connect the Xero organisation you link to Owed.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Free trial</h2>
            <p>New accounts receive a 14-day free trial with full access to all features. No credit card is required to start. At the end of your trial, you will need to subscribe to continue using Owed.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Pricing and payment</h2>
            <p>Owed costs £19 per month, billed monthly via Stripe. You can cancel at any time. Cancellation takes effect at the end of your current billing period. We do not offer refunds for partial months.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">What we&apos;re responsible for</h2>
            <p>We will make reasonable efforts to deliver chase emails reliably and on schedule. We will keep your data secure. We will not modify your Xero data — our access is read-only.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">What we&apos;re not responsible for</h2>
            <p>We cannot guarantee that chase emails will result in payment. We are not responsible for the accuracy of data in your Xero account. We are not responsible for any disputes between you and your clients arising from chase emails. Email delivery depends on third-party infrastructure and we cannot guarantee inbox placement. Open tracking is indicative only — some email clients pre-load tracking pixels.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">The emails we send</h2>
            <p>Chase emails are sent from accounts@owedhq.com with your email as the reply-to. The email content follows our standard 4-stage sequence. By using Owed, you authorise us to send these emails to your clients on your behalf. You can pause or stop chasing for any invoice at any time.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Late Payment Act references</h2>
            <p>Owed may display information about your rights under the Late Commercial Payments (Interest) Act 1998. This is general information only and does not constitute legal advice. Consult a solicitor for advice specific to your situation.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Termination</h2>
            <p>You can delete your account at any time by contacting support@owedhq.com. We may terminate your account if you violate these terms, use the service to harass or threaten, or attempt to send emails to contacts who have not done business with you.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Changes to terms</h2>
            <p>We may update these terms from time to time. We will notify you of significant changes via email. Continued use of Owed after changes constitutes acceptance.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Governing law</h2>
            <p>These terms are governed by the laws of England and Wales.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Contact</h2>
            <p>Useful for Humans Ltd · support@owedhq.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
