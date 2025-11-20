create table public.organizations (
  id uuid not null default gen_random_uuid (),
  name text not null,
  email text null,
  phone text null,
  logo text null,
  address text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  currency text null default 'GHS'::text,
  logo_settings jsonb null default '{}'::jsonb,
  brand_colors jsonb null default '{}'::jsonb,
  notification_settings jsonb null default '{}'::jsonb,
  is_active boolean null default true,
  theme_name text null,
  constraint organizations_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_organizations_name on public.organizations using btree (name) TABLESPACE pg_default;

create trigger update_organizations_updated_at BEFORE
update on organizations for EACH row
execute FUNCTION handle_updated_at ();