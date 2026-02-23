-- =============================================
-- OWED — Full Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Profiles (extends Supabase Auth users)
create table public.profiles (
  id uuid references auth.users primary key,
  email text not null,
  business_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Accounting provider connections
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  provider text not null check (provider in ('xero', 'quickbooks', 'sage')),
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  tenant_id text,
  tenant_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.connections enable row level security;

create policy "Users can view own connections"
  on public.connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own connections"
  on public.connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own connections"
  on public.connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own connections"
  on public.connections for delete
  using (auth.uid() = user_id);


-- 3. Synced invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  connection_id uuid references public.connections not null,
  external_id text not null,
  invoice_number text,
  contact_name text not null,
  contact_email text,
  amount_due numeric(12,2) not null,
  currency text default 'GBP',
  due_date date not null,
  days_overdue int generated always as (
    greatest(0, current_date - due_date)
  ) stored,
  status text default 'open' check (status in ('open','paid','paused','completed')),
  chasing_enabled boolean default true,
  last_synced_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(connection_id, external_id)
);

alter table public.invoices enable row level security;

create policy "Users can view own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

create policy "Users can insert own invoices"
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own invoices"
  on public.invoices for update
  using (auth.uid() = user_id);


-- 4. Chase emails
create table public.chase_emails (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices not null,
  user_id uuid references public.profiles not null,
  stage int not null check (stage between 1 and 4),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  opened_at timestamptz,
  resend_message_id text,
  status text default 'scheduled' check (status in ('scheduled','sent','cancelled')),
  created_at timestamptz default now()
);

alter table public.chase_emails enable row level security;

create policy "Users can view own chase_emails"
  on public.chase_emails for select
  using (auth.uid() = user_id);

create policy "Users can insert own chase_emails"
  on public.chase_emails for insert
  with check (auth.uid() = user_id);

create policy "Users can update own chase_emails"
  on public.chase_emails for update
  using (auth.uid() = user_id);


-- 5. Stripe subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null unique,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  status text default 'trialing',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);


-- 6. Platform stats (public read)
create table public.platform_stats (
  id int primary key default 1,
  total_recovered numeric(14,2) default 0,
  total_invoices_paid int default 0,
  updated_at timestamptz default now()
);

alter table public.platform_stats enable row level security;

create policy "Anyone can read platform stats"
  on public.platform_stats for select
  using (true);

insert into public.platform_stats (id) values (1);


-- 7. Helper function: increment recovered amount
create or replace function increment_recovered(amount numeric)
returns void as $$
  update platform_stats
  set total_recovered = total_recovered + amount,
      total_invoices_paid = total_invoices_paid + 1,
      updated_at = now()
  where id = 1;
$$ language sql;
