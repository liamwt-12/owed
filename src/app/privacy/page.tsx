export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-[640px] mx-auto px-6 py-20">
        <h1 className="font-syne font-extrabold text-3xl text-ink tracking-tight mb-8">Privacy Policy</h1>
        <div className="text-sm text-muted leading-relaxed space-y-6">
          <p className="text-xs text-faint">Last updated: February 2026</p>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">What we are</h2>
            <p>Owed (owedhq.com) is a trading name of Useful for Humans Ltd. We help UK small businesses chase overdue invoices by connecting to their accounting software and sending professional reminder emails on their behalf.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">What we collect</h2>
            <p>When you sign up, we store your email address and optional business name. When you connect Xero, we access your overdue sales invoices (read-only) including: invoice numbers, amounts, due dates, and contact names, email addresses, and phone numbers. We also store OAuth tokens to maintain your Xero connection.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">How we use it</h2>
            <p>We use your invoice data solely to identify overdue invoices and send chase emails on your behalf. We use your email address to send you product communications including weekly digest emails. We never sell your data. We never share your data with third parties except our essential service providers (Supabase for database hosting, Resend for email delivery, Stripe for payments, Vercel for hosting).</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Emails we send</h2>
            <p>Chase emails are sent from accounts@owedhq.com on your behalf, with your email as the reply-to address. Your clients can reply directly to you. We also send you a weekly digest email summarising your chasing activity. You can manage email preferences in your settings.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Data security</h2>
            <p>Your data is encrypted in transit and at rest. OAuth tokens are stored securely in our database with row-level security. We use the minimum Xero permissions required (read-only access to invoices). We never modify your accounting data.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Data retention</h2>
            <p>We retain your data for as long as your account is active. If you disconnect Xero or delete your account, we remove your invoice data within 30 days. You can request full data deletion at any time by emailing support@owedhq.com.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Your rights</h2>
            <p>Under UK GDPR, you have the right to access, correct, delete, or export your personal data. You can disconnect Xero at any time from your settings page. To exercise any of these rights, email support@owedhq.com.</p>
          </div>

          <div>
            <h2 className="text-ink font-semibold text-base mb-2">Cookies</h2>
            <p>We use essential cookies only — for authentication and session management. We do not use tracking cookies or third-party analytics.</p>
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
