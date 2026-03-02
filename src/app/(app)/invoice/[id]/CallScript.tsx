'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CallScript({
  invoiceId,
  phone,
  contactName,
  invoiceNumber,
  businessName,
}: {
  invoiceId: string
  phone: string
  contactName: string
  invoiceNumber: string
  businessName: string
}) {
  const [open, setOpen] = useState(false)
  const [logging, setLogging] = useState(false)
  const router = useRouter()

  const firstName = contactName.split(' ')[0] || 'there'

  async function handleLogCall() {
    setLogging(true)
    await fetch('/api/invoices/log-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId, contact_name: contactName }),
    })
    window.location.href = `tel:${phone.replace(/\s/g, '')}`
    setTimeout(() => {
      setLogging(false)
      router.refresh()
    }, 1000)
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink transition-colors"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Suggested call script
      </button>

      {open && (
        <div className="mt-3 bg-paper border border-line rounded-xl p-4">
          <p className="text-sm text-ink leading-relaxed italic">
            &ldquo;Hi {firstName}, it&apos;s {businessName}. I&apos;m just calling about invoice {invoiceNumber}. I know a few reminders have gone out and I wanted to check in personally. Is everything OK?&rdquo;
          </p>
          <button
            onClick={handleLogCall}
            disabled={logging}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo/10 text-indigo hover:bg-indigo/20 transition-colors disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            {logging ? 'Logging...' : 'Log this call'}
          </button>
        </div>
      )}
    </div>
  )
}
