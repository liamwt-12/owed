'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SettingsForm({ businessName, email }: { businessName: string; email: string }) {
  const [name, setName] = useState(businessName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_name: name }),
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
      <button
        onClick={handleSave}
        disabled={saving || name === businessName}
        className="px-4 py-2 bg-ink text-paper text-sm font-semibold rounded-lg hover:bg-ink-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
      </button>
    </div>
  )
}
