import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StartChasingButton } from './StartChasingButton'

export default async function WelcomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('welcome_seen')
    .eq('id', user.id)
    .single()

  if (profile?.welcome_seen) {
    redirect('/dashboard')
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount_due, due_date, contact_name')
    .eq('user_id', user.id)
    .eq('status', 'open')

  const overdueInvoices = (invoices || []).filter(
    inv => new Date(inv.due_date) < new Date()
  )

  const totalOwed = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amount_due), 0)
  const count = overdueInvoices.length

  // Find oldest overdue invoice
  let oldestDays = 0
  if (count > 0) {
    const now = Date.now()
    oldestDays = overdueInvoices.reduce((max, inv) => {
      const days = Math.floor((now - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
      return days > max ? days : max
    }, 0)
  }

  if (count === 0) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-[560px] mx-auto mt-12 md:mt-20 text-center">
      <div className="flex items-center justify-center gap-2 mb-8">
        <span className="w-2 h-2 bg-pop rounded-full" />
        <span className="text-xs font-semibold text-faint uppercase tracking-wider">First sync complete</span>
      </div>

      <h1 className="font-syne font-extrabold text-4xl md:text-5xl tracking-tight leading-[1.05] mb-4">
        You&apos;re owed<br />
        <span className="text-pop">£{totalOwed.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
      </h1>

      <p className="text-muted text-lg mb-10">
        {count} invoice{count !== 1 ? 's' : ''} overdue. The oldest is {oldestDays} day{oldestDays !== 1 ? 's' : ''} late.
      </p>

      <StartChasingButton count={count} />

      <p className="text-faint text-sm mt-4">You can exclude specific invoices after.</p>
    </div>
  )
}
