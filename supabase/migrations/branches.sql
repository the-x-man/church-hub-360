create table public.branches (
  id uuid not null default gen_random_uuid (),
  name text not null,
  location text not null,
  description text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  organization_id uuid null,
  contact text null,
  constraint branches_pkey primary key (id),
  constraint branches_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_branches_is_active on public.branches using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_branches_org_id on public.branches using btree (organization_id) TABLESPACE pg_default;

create trigger update_branches_updated_at BEFORE
update on branches for EACH row
execute FUNCTION handle_updated_at ();

-- Create user_branches table to track which branches users belong to
create table public.user_branches (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  branch_id uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  organization_id uuid not null,
  created_by uuid null,
  constraint user_branches_pkey primary key (id),
  constraint user_branches_user_branch_org_unique unique (user_id, branch_id, organization_id),
  constraint user_branches_created_by_fkey1 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint user_branches_created_by_fkey2 foreign KEY (created_by) references auth_users (id) on delete set null,
  constraint user_branches_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint user_branches_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_branches_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete CASCADE,
  constraint user_branches_user_id_fkey1 foreign KEY (user_id) references profiles (id) on delete set null,
  constraint user_branches_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_user_branches_user_id on public.user_branches using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_user_branches_user_id_profiles on public.user_branches using btree (user_id) TABLESPACE pg_default; -- For profiles relationship

create index IF not exists idx_user_branches_branch_id on public.user_branches using btree (branch_id) TABLESPACE pg_default;
create index IF not exists idx_user_branches_organization_id on public.user_branches using btree (organization_id) TABLESPACE pg_default;

create trigger update_user_branches_updated_at BEFORE
update on user_branches for EACH row
execute FUNCTION handle_updated_at ();

-- Enable RLS
alter table public.branches enable row level security;
alter table public.user_branches enable row level security;

-- RLS Policies - Allow all access to authenticated users
create policy "Allow all access to authenticated users" on public.branches
  for all using (auth.role() = 'authenticated');

create policy "Allow all access to authenticated users" on public.user_branches
  for all using (auth.role() = 'authenticated');