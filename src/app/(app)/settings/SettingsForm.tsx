'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SettingsForm({
  businessName,
  email,
  statutoryInterestEnabled,
  paymentLink,
  thankYouEnabled,
}: {
  businessName: string
  email: string
  statutoryInterestEnabled: boolean
  paymentLink: string
  thankYouEnabled: boolean
}) {
  const [name, setName] = useState(businessName)
  const [interestToggle, setInterestToggle] = useState(statutoryInterestEnabled)
  const [link, setLink] = useState(paymentLink)
  const [thankYou, setThankYou] = useState(thankYouEnabled)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const hasChanges =
    name !== businessName ||
    interestToggle !== statutoryInterestEnabled ||
    link !== paymentLink ||
    thankYou !== thankYouEnabled

  async function handleSave() {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name: name,
        statutory_interest_enabled: interestToggle,
        payment_link: link || null,
        thank_you_enabled: thankYou,
      }),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <label className="block text-xs text-muted mb-1.5">Business name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Acme Design Ltd"
        className="w-full px-3 py-2 text-sm border border-line rounded-lg bg-paper text-ink placeholder:text-faint focus:outline-none focus:border-ink transition-colors mb-4"
      />
      <label className="block text-xs text-muted mb-1.5">Email (replies go here)</label>
      <input
        type="text"
        value={email}
        disabled
        className="w-full px-3 py-2 text-sm border border-line rounded-lg bg-cream text-muted mb-4 cursor-not-allowed"
      />

      {/* Payment link */}
      <label className="block text-xs text-muted mb-1.5">Payment link URL (optional)</label>
      <input
        type="url"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="e.g. https://pay.stripe.com/your-link or PayPal.me link"
        className="w-full px-3 py-2 text-sm border border-line rounded-lg bg-paper text-ink placeholder:text-faint focus:outline-none focus:border-ink transition-colors mb-1"
      />
      <p className="text-xs text-faint mb-4">If set, a &ldquo;Pay this invoice&rdquo; button will appear in every chase email.</p>

      {/* Statutory interest toggle */}
      <div className="flex items-start gap-3 mb-3 p-3 bg-paper border border-line rounded-lg">
        <button
          type="button"
          role="switch"
          aria-checked={interestToggle}
          onClick={() => setInterestToggle(!interestToggle)}
          className={`relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors ${interestToggle ? 'bg-ink' : 'bg-line'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${interestToggle ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
        </button>
        <div>
          <p className="text-sm font-medium text-ink">Include statutory interest reminder</p>
          <p className="text-xs text-muted mt-0.5">When enabled, stages 3 and 4 of the chase sequence will mention the interest and compensation owed under the Late Payment Act.</p>
        </div>
      </div>

      {/* Thank you email toggle */}
      <div className="flex items-start gap-3 mb-6 p-3 bg-paper border border-line rounded-lg">
        <button
          type="button"
          role="switch"
          aria-checked={thankYou}
          onClick={() => setThankYou(!thankYou)}
          className={`relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors ${thankYou ? 'bg-ink' : 'bg-line'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${thankYou ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
        </button>
        <div>
          <p className="text-sm font-medium text-ink">Send thank-you email when invoice is paid</p>
          <p className="text-xs text-muted mt-0.5">When a payment is detected via Xero, automatically send a short thank-you note to your client.</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className="px-4 py-2 bg-ink text-paper text-sm font-semibold rounded-lg hover:bg-ink-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
      </button>
    </div>
  )
}
