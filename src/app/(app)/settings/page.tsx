import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './SettingsForm'
import { SyncButton } from './SyncButton'
import { DisconnectButton } from './DisconnectButton'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: connection } = await supabase
    .from('connections')
    .select('provider, tenant_name, updated_at')
    .eq('user_id', user.id)
    .single()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('amount_due, status')
    .eq('user_id', user.id)
    .eq('status', 'paid')

  const totalRecovered = invoices?.reduce((sum, inv) => sum + Number(inv.amount_due), 0) || 0

  return (
    <div className="max-w-[560px]">
      <h1 className="font-syne font-extrabold text-2xl text-ink tracking-tight mb-6">Settings</h1>

      {/* Recovery stat */}
      {totalRecovered > 0 && (
        <div className="bg-green text-white rounded-2xl p-6 mb-4">
          <p className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-1">Total recovered</p>
          <p className="font-syne font-extrabold text-3xl">£{totalRecovered.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-white/60 mt-1">{invoices?.length} invoice{invoices?.length !== 1 ? 's' : ''} paid via Owed</p>
        </div>
      )}

      {/* Business details */}
      <div className="bg-white border border-line rounded-2xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-ink mb-4">Business details</h2>
        <SettingsForm
          businessName={profile?.business_name || ''}
          email={profile?.email || user.email || ''}
        />
      </div>

      {/* Connection */}
      <div className="bg-white border border-line rounded-2xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-ink mb-4">Connected accounts</h2>
        {connection ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#13B5EA] rounded-lg flex items-center justify-center text-white text-xs font-bold">X</div>
                <div>
                  <p className="text-sm font-medium text-ink">{connection.tenant_name || 'Xero'}</p>
                  <p className="text-xs text-faint">Last synced {connection.updated_at ? new Date(connection.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'recently'}</p>
                </div>
              </div>
              <span className="text-xs text-green font-semibold bg-green-pale px-2 py-1 rounded-full">Active</span>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-line">
              <SyncButton />
              <DisconnectButton />
            </div>
          </div>
        ) : (
          <a href="/onboarding/connect" className="text-sm text-ink font-medium hover:underline">Connect Xero →</a>
        )}
      </div>

      {/* Email preview */}
      <div className="bg-white border border-line rounded-2xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-ink mb-1">Email preview</h2>
        <p className="text-xs text-muted mb-4">This is what your clients see when Owed chases on your behalf.</p>
        <div className="bg-paper border border-line rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-xs text-faint">From:</div>
            <div className="text-xs text-ink font-medium">accounts@owedhq.com</div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-xs text-faint">Reply-To:</div>
            <div className="text-xs text-ink font-medium">{profile?.email || user.email}</div>
          </div>
          <div className="border-t border-line pt-3 mt-1">
            <p className="text-xs font-medium text-ink mb-2">Invoice INV-001 — Quick reminder</p>
            <p className="text-xs text-muted leading-relaxed">
              Hi there,<br /><br />
              Just a quick note that invoice INV-001 for £500.00 was due on 1 January 2026.<br /><br />
              If you&apos;ve already sent payment, please ignore this — and thank you.<br /><br />
              Many thanks,<br />
              {profile?.business_name || 'Your Business'}
            </p>
            <p className="text-[10px] text-faint mt-4 pt-3 border-t border-line">
              Sent on behalf of {profile?.business_name || 'Your Business'} · Powered by Owed
            </p>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white border border-line rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-ink mb-1">Account</h2>
        <p className="text-xs text-muted">Need to delete your account or have questions? Email support@owedhq.com</p>
      </div>
    </div>
  )
}
