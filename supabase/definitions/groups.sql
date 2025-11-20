create table public.groups (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  branch_id uuid null,
  name character varying(255) not null,
  description text null,
  type character varying(20) null default 'permanent'::character varying,
  start_date date null,
  end_date date null,
  is_closed boolean null default false,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  last_updated_by uuid null,
  constraint groups_pkey primary key (id),
  constraint groups_organization_id_name_key unique (organization_id, name),
  constraint fk_committees_branch_id foreign KEY (branch_id) references branches (id) on delete set null,
  constraint committees_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint fk_committees_last_updated_by_auth_users foreign KEY (last_updated_by) references auth.users (id) on delete set null,
  constraint fk_committees_organization_id foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint fk_committees_created_by_auth_users foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint committees_last_updated_by_fkey foreign KEY (last_updated_by) references auth.users (id),
  constraint committees_type_check check (
    (
      (type)::text = any (
        (
          array[
            'permanent'::character varying,
            'temporal'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_groups_organization_id on public.groups using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_groups_branch_id on public.groups using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_groups_name on public.groups using btree (name) TABLESPACE pg_default;

create index IF not exists idx_groups_type on public.groups using btree (type) TABLESPACE pg_default;

create index IF not exists idx_groups_is_active on public.groups using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_groups_is_closed on public.groups using btree (is_closed) TABLESPACE pg_default;

create index IF not exists idx_groups_start_date on public.groups using btree (start_date) TABLESPACE pg_default;

create index IF not exists idx_groups_end_date on public.groups using btree (end_date) TABLESPACE pg_default;

create index IF not exists idx_groups_created_by on public.groups using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_groups_last_updated_by on public.groups using btree (last_updated_by) TABLESPACE pg_default;

create trigger update_groups_updated_at BEFORE
update on groups for EACH row
execute FUNCTION update_updated_at_column ();