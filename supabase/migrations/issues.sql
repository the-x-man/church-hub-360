-- Create issues table for storing user-reported issues
create table public.issues (
  id uuid not null default gen_random_uuid (),
  issue_type text not null check (issue_type in ('bug_report', 'feedback', 'suggestion')),
  description text not null,
  email text not null,
  screenshot_url text null,
  user_id uuid null,
  user_agent text null,
  app_version text null,
  platform text null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  resolved_at timestamp with time zone null,
  resolved_by uuid null,
  notes text null,
  constraint issues_pkey primary key (id),
  constraint issues_user_id_fkey foreign key (user_id) references auth.users (id) on delete set null,
  constraint issues_resolved_by_fkey foreign key (resolved_by) references auth.users (id) on delete set null
) tablespace pg_default;

-- Create indexes for better query performance
create index if not exists idx_issues_status on public.issues using btree (status) tablespace pg_default;
create index if not exists idx_issues_priority on public.issues using btree (priority) tablespace pg_default;
create index if not exists idx_issues_issue_type on public.issues using btree (issue_type) tablespace pg_default;
create index if not exists idx_issues_user_id on public.issues using btree (user_id) tablespace pg_default;
create index if not exists idx_issues_created_at on public.issues using btree (created_at) tablespace pg_default;

-- Create trigger to update the updated_at timestamp
create trigger update_issues_updated_at before
update on issues for each row
execute function handle_updated_at ();

-- Enable Row Level Security (RLS)
alter table public.issues enable row level security;

-- Create RLS policies
-- Users can view their own issues
create policy "Users can view their own issues" on public.issues
  for select using (auth.uid() = user_id);

-- Allow anyone to insert issues (both authenticated and anonymous users)
create policy "Anyone can insert issues" on public.issues
  for insert with check (true);

-- Admin users can view all issues (assuming there's an admin role)
create policy "Admin users can view all issues" on public.issues
  for select using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Admin users can update all issues
create policy "Admin users can update all issues" on public.issues
  for update using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.issues to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;