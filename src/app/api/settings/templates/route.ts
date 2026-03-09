import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DEFAULT_TEMPLATES = [
  {
    stage: 1,
    subject: 'Invoice {{invoice_number}} — Quick reminder',
    body: `Hi {{first_name}},

Just a quick note that invoice {{invoice_number}} for {{amount}} was due on {{due_date}}. If you've already sent payment, please ignore this.

If not, I'd appreciate it if you could arrange payment at your earliest convenience.

Thanks,
{{business_name}}`,
  },
  {
    stage: 2,
    subject: 'Invoice {{invoice_number}} — Payment outstanding',
    body: `Hi {{first_name}},

Following up on invoice {{invoice_number}} for {{amount}}, which is now a week overdue. Could you let me know when I can expect payment? Happy to discuss if there's an issue.

{{business_name}}`,
  },
  {
    stage: 3,
    subject: 'Invoice {{invoice_number}} — Action required',
    body: `Invoice {{invoice_number}} for {{amount}} is now 14 days overdue. I'd appreciate confirmation of payment within 5 working days.

{{business_name}}`,
  },
  {
    stage: 4,
    subject: 'Invoice {{invoice_number}} — Final notice',
    body: `This is my final reminder regarding invoice {{invoice_number}} for {{amount}}, now 21 days overdue. If I don't hear back within 7 days, I may need to consider next steps, which I'd really rather avoid.

Please get in touch.

{{business_name}}`,
  },
]

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: templates } = await supabase
    .from('chase_templates')
    .select('stage, subject, body')
    .eq('user_id', user.id)
    .order('stage')

  // Merge saved templates with defaults
  const merged = DEFAULT_TEMPLATES.map((def) => {
    const saved = templates?.find((t) => t.stage === def.stage)
    return saved
      ? { stage: def.stage, subject: saved.subject, body: saved.body, isCustom: true }
      : { ...def, isCustom: false }
  })

  return NextResponse.json({ templates: merged })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stage, subject, body } = await request.json()

  if (!stage || stage < 1 || stage > 4) {
    return NextResponse.json({ error: 'Stage must be between 1 and 4' }, { status: 400 })
  }
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('chase_templates')
    .upsert(
      { user_id: user.id, stage, subject: subject.trim(), body: body.trim(), updated_at: new Date().toISOString() },
      { onConflict: 'user_id,stage' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stage } = await request.json()

  if (!stage || stage < 1 || stage > 4) {
    return NextResponse.json({ error: 'Stage must be between 1 and 4' }, { status: 400 })
  }

  await supabase
    .from('chase_templates')
    .delete()
    .eq('user_id', user.id)
    .eq('stage', stage)

  return NextResponse.json({ success: true })
}
