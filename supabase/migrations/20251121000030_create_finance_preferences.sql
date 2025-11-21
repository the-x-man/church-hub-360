create table if not exists public.finance_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  expenses_prefs text null,
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.finance_preferences enable row level security;

grant select, insert, update, delete on public.finance_preferences to authenticated;