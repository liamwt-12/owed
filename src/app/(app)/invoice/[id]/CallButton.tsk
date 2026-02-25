'use client'

import { useRouter } from 'next/navigation'

export function CallButton({ invoiceId, phone, contactName }: { invoiceId: string; phone: string; contactName: string }) {
  const router = useRouter()

  async function handleCall() {
    // Log the call in activity
    await fetch('/api/invoices/log-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId, contact_name: contactName }),
    })

    // Open native dialler
    window.location.href = `tel:${phone.replace(/\s/g, '')}`

    // Refresh to show in timeline
    setTimeout(() => router.refresh(), 1000)
  }

  return (
    <button
      onClick={handleCall}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo/10 text-indigo hover:bg-indigo/20 transition-colors mt-2"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      Call {contactName.split(' ')[0]}
    </button>
  )
}
