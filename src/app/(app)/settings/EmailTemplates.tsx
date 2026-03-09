'use client'

import { useEffect, useRef, useState } from 'react'

const STAGE_LABELS = ['Gentle reminder', 'Follow-up', 'Firm notice', 'Final warning']
const MERGE_TAGS = ['{{first_name}}', '{{amount}}', '{{invoice_number}}', '{{due_date}}', '{{business_name}}']

type Template = {
  stage: number
  subject: string
  body: string
  isCustom: boolean
}

export function EmailTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeStage, setActiveStage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [dirty, setDirty] = useState<Record<number, boolean>>({})
  const [originals, setOriginals] = useState<Template[]>([])
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch('/api/settings/templates')
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates)
        setOriginals(data.templates.map((t: Template) => ({ ...t })))
      })
  }, [])

  const current = templates.find((t) => t.stage === activeStage)
  if (!current && templates.length === 0) {
    return (
      <div className="bg-white border border-line rounded-2xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-ink mb-1">Chase email templates</h2>
        <p className="text-xs text-muted">Loading...</p>
      </div>
    )
  }
  if (!current) return null

  function updateField(stage: number, field: 'subject' | 'body', value: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.stage === stage ? { ...t, [field]: value } : t))
    )
    setDirty((prev) => ({ ...prev, [stage]: true }))
    setFeedback(null)
  }

  function insertTag(tag: string) {
    const textarea = bodyRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const body = current!.body
    const newBody = body.substring(0, start) + tag + body.substring(end)
    updateField(activeStage, 'body', newBody)
    // Restore cursor after tag
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + tag.length
    })
  }

  async function handleSave() {
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/settings/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: current!.stage, subject: current!.subject, body: current!.body }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      setTemplates((prev) =>
        prev.map((t) => (t.stage === activeStage ? { ...t, isCustom: true } : t))
      )
      setOriginals((prev) =>
        prev.map((t) => (t.stage === activeStage ? { ...current!, isCustom: true } : t))
      )
      setDirty((prev) => ({ ...prev, [activeStage]: false }))
      setFeedback({ type: 'success', message: 'Template saved' })
      setTimeout(() => setFeedback(null), 2000)
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/settings/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: activeStage }),
      })
      if (!res.ok) throw new Error('Failed to reset')
      // Re-fetch to get defaults
      const freshRes = await fetch('/api/settings/templates')
      const freshData = await freshRes.json()
      setTemplates(freshData.templates)
      setOriginals(freshData.templates.map((t: Template) => ({ ...t })))
      setDirty((prev) => ({ ...prev, [activeStage]: false }))
      setFeedback({ type: 'success', message: 'Reset to default' })
      setTimeout(() => setFeedback(null), 2000)
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-line rounded-2xl p-6 mb-4">
      <h2 className="text-sm font-semibold text-ink mb-1">Chase email templates</h2>
      <p className="text-xs text-muted mb-4">Customise the subject and body for each chase stage. Use merge tags to personalise.</p>

      {/* Stage tabs */}
      <div className="flex gap-1 mb-4 bg-paper border border-line rounded-lg p-1">
        {STAGE_LABELS.map((label, i) => {
          const stage = i + 1
          return (
            <button
              key={stage}
              onClick={() => { setActiveStage(stage); setFeedback(null) }}
              className={`flex-1 text-xs font-medium py-2 px-1 rounded-md transition-colors ${
                activeStage === stage
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {stage}. {label}
            </button>
          )
        })}
      </div>

      {/* Subject */}
      <label className="block text-xs text-muted mb-1.5">Subject line</label>
      <input
        type="text"
        value={current.subject}
        onChange={(e) => updateField(activeStage, 'subject', e.target.value)}
        className="w-full px-3 py-2 text-sm border border-line rounded-lg bg-paper text-ink placeholder:text-faint focus:outline-none focus:border-ink transition-colors mb-3"
      />

      {/* Body */}
      <label className="block text-xs text-muted mb-1.5">Email body</label>
      <textarea
        ref={bodyRef}
        value={current.body}
        onChange={(e) => updateField(activeStage, 'body', e.target.value)}
        rows={8}
        className="w-full px-3 py-2 text-sm border border-line rounded-lg bg-paper text-ink placeholder:text-faint focus:outline-none focus:border-ink transition-colors resize-y mb-2 font-mono"
      />

      {/* Merge tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="text-xs text-faint mr-1 self-center">Insert:</span>
        {MERGE_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => insertTag(tag)}
            className="px-2 py-1 text-xs font-mono bg-paper border border-line rounded-md text-muted hover:text-ink hover:border-ink transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !dirty[activeStage]}
          className="px-4 py-2 bg-ink text-paper text-sm font-semibold rounded-lg hover:bg-ink-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {current.isCustom && (
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-sm text-muted hover:text-ink transition-colors disabled:opacity-40"
          >
            Reset to default
          </button>
        )}
        {feedback && (
          <span className={`text-xs font-medium ${feedback.type === 'success' ? 'text-green' : 'text-pop'}`}>
            {feedback.message}
          </span>
        )}
      </div>
    </div>
  )
}
