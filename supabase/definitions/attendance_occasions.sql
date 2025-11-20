create table public.attendance_occasions (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  branch_id uuid null,
  name text not null,
  description text null,
  recurrence_rule text null,
  default_duration_minutes integer null,
  is_active boolean not null default true,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  last_updated_by uuid null,
  is_deleted boolean null default false,
  constraint attendance_occasions_pkey primary key (id),
  constraint attendance_occasions_created_by_fkey foreign KEY (created_by) references auth_users (id) on delete RESTRICT,
  constraint attendance_occasions_created_by_fkey1 foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint attendance_occasions_created_by_fkey2 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint attendance_occasions_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete CASCADE,
  constraint attendance_occasions_last_updated_by_fkey1 foreign KEY (last_updated_by) references auth_users (id) on delete set null,
  constraint attendance_occasions_last_updated_by_fkey2 foreign KEY (last_updated_by) references auth.users (id) on delete set null,
  constraint attendance_occasions_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint attendance_occasions_last_updated_by_fkey foreign KEY (last_updated_by) references profiles (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_attendance_occasions_organization_id on public.attendance_occasions using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_attendance_occasions_branch_id on public.attendance_occasions using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_attendance_occasions_is_active on public.attendance_occasions using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_attendance_occasions_created_by on public.attendance_occasions using btree (created_by) TABLESPACE pg_default;

create trigger update_attendance_occasions_updated_at BEFORE
update on attendance_occasions for EACH row
execute FUNCTION update_updated_at_column ();