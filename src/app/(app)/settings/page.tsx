import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './SettingsForm'
import { SyncButton } from './SyncButton'
import { DisconnectButton } from './DisconnectButton'
import { ManageBillingButton } from './ManageBillingButton'
import { EmailTemplates } from './EmailTemplates'

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
          <p className="font-syne font-extrabold text-3xl">&pound;{totalRecovered.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-white/60 mt-1">{invoices?.length} invoice{invoices?.length !== 1 ? 's' : ''} paid via Owed</p>
        </div>
      )}

      {/* Business details */}
      <div className="bg-white border border-line rounded-2xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-ink mb-4">Business details</h2>
        <SettingsForm
          businessName={profile?.business_name || ''}
          email={profile?.email || user.email || ''}
          statutoryInterestEnabled={profile?.statutory_interest_enabled || false}
          paymentLink={profile?.payment_link || ''}
          thankYouEnabled={profile?.thank_you_enabled || false}
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
          <a href="/onboarding/connect" className="text-sm text-ink font-medium hover:underline">Connect Xero &rarr;</a>
        )}
      </div>

      {/* Billing */}
      <div className="bg-white border border-line rounded-2xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-ink mb-4">Billing</h2>
        {totalRecovered > 0 && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-green-pale border border-green/15 rounded-lg">
            <span className="w-1.5 h-1.5 bg-pop rounded-full flex-shrink-0" />
            <p className="text-sm text-green font-medium">Since you started using Owed, you&apos;ve recovered &pound;{totalRecovered.toLocaleString('en-GB', { minimumFractionDigits: 2 })}.</p>
          </div>
        )}
        <ManageBillingButton />
        <p className="text-xs text-muted mt-2">View invoices, update payment method, or cancel.</p>
      </div>

      {/* Chase email templates */}
      <EmailTemplates />

      {/* Account */}
      <div className="bg-white border border-line rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-ink mb-1">Account</h2>
        <p className="text-xs text-muted">Need to delete your account or have questions? Email support@owedhq.com</p>
      </div>
    </div>
  )
}
