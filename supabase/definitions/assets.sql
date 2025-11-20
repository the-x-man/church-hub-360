create table public.assets (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  branch_id uuid null,
  name text not null,
  description text null,
  category text null,
  status text null,
  location text null,
  assigned_to_type text null,
  images text[] null default array[]::text[],
  purchase_date date null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  is_deleted boolean not null default false,
  assigned_to_member_id uuid null,
  assigned_to_group_id uuid null,
  constraint assets_pkey primary key (id),
  constraint assets_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete set null,
  constraint assets_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint assets_assigned_to_type_check check (
    (
      (assigned_to_type is null)
      or (
        assigned_to_type = any (array['member'::text, 'group'::text])
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_assets_org on public.assets using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_assets_status on public.assets using btree (status) TABLESPACE pg_default;

create index IF not exists idx_assets_category on public.assets using btree (category) TABLESPACE pg_default;

create trigger update_assets_updated_at BEFORE
update on assets for EACH row
execute FUNCTION handle_updated_at ();