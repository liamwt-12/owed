'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('id', user.id)
        .single()
      if (data?.business_name) setBusinessName(data.business_name)
    }
    load()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ business_name: businessName })
      .eq('id', user.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-[520px]">
      <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-8">
        Settings
      </h1>

      <div className="bg-white border border-line rounded-2xl p-6">
        <label className="block text-sm font-medium text-ink mb-1.5">
          Business name
        </label>
        <p className="text-sm text-muted mb-3">
          This appears on chase emails sent to your clients.
        </p>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-ink text-[15px] outline-none focus:border-ink transition-colors mb-4"
          placeholder="Your Business Ltd"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-ink text-paper font-semibold text-sm rounded-lg hover:bg-ink-2 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
