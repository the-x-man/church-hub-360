create table public.attendance_sessions (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  occasion_id uuid not null,
  name text null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  is_open boolean not null default false,
  allow_public_marking boolean not null default false,
  proximity_required boolean not null default false,
  location jsonb null,
  allowed_tags uuid[] null,
  marking_modes jsonb null default '{"email": true, "phone": true, "manual": true, "public_link": false, "membership_id": true}'::jsonb,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  is_deleted boolean not null default false,
  last_updated_by uuid null,
  branch_id uuid null,
  allowed_groups uuid[] null,
  allowed_members uuid[] null,
  constraint attendance_sessions_pkey primary key (id),
  constraint attendance_sessions_created_by_fkey foreign KEY (created_by) references profiles (id) on delete RESTRICT,
  constraint attendance_sessions_created_by_fkey1 foreign KEY (created_by) references auth_users (id) on delete set null,
  constraint attendance_sessions_created_by_fkey2 foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint attendance_sessions_last_updated_by_fkey foreign KEY (last_updated_by) references profiles (id) on delete set null,
  constraint attendance_sessions_last_updated_by_fkey1 foreign KEY (last_updated_by) references auth_users (id) on delete set null,
  constraint attendance_sessions_last_updated_by_fkey2 foreign KEY (last_updated_by) references auth.users (id) on delete set null,
  constraint attendance_sessions_occasion_id_fkey foreign KEY (occasion_id) references attendance_occasions (id) on delete CASCADE,
  constraint attendance_sessions_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint attendance_sessions_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete CASCADE,
  constraint attendance_sessions_end_time_after_start_time check ((end_time > start_time)),
  constraint attendance_sessions_valid_location check (
    (
      (location is null)
      or (
        (location ? 'lat'::text)
        and (location ? 'lng'::text)
        and (
          (
            ((location ->> 'lat'::text))::numeric >= ('-90'::integer)::numeric
          )
          and (
            ((location ->> 'lat'::text))::numeric <= (90)::numeric
          )
        )
        and (
          (
            ((location ->> 'lng'::text))::numeric >= ('-180'::integer)::numeric
          )
          and (
            ((location ->> 'lng'::text))::numeric <= (180)::numeric
          )
        )
        and (
          ((location ? 'radius'::text) is false)
          or (
            ((location ->> 'radius'::text))::numeric > (0)::numeric
          )
        )
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_attendance_sessions_organization_id on public.attendance_sessions using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_attendance_sessions_occasion_id on public.attendance_sessions using btree (occasion_id) TABLESPACE pg_default;

create index IF not exists idx_attendance_sessions_start_time on public.attendance_sessions using btree (start_time) TABLESPACE pg_default;

create index IF not exists idx_attendance_sessions_end_time on public.attendance_sessions using btree (end_time) TABLESPACE pg_default;

create index IF not exists idx_attendance_sessions_is_open on public.attendance_sessions using btree (is_open) TABLESPACE pg_default;

create index IF not exists idx_attendance_sessions_created_by on public.attendance_sessions using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_attendance_sessions_is_deleted on public.attendance_sessions using btree (is_deleted) TABLESPACE pg_default;

create index IF not exists idx_attendance_sessions_org_occasion on public.attendance_sessions using btree (organization_id, occasion_id) TABLESPACE pg_default;

create index IF not exists idx_attendance_sessions_org_active on public.attendance_sessions using btree (organization_id, is_open) TABLESPACE pg_default
where
  (is_deleted = false);

create index IF not exists idx_attendance_sessions_time_range on public.attendance_sessions using btree (start_time, end_time) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger update_attendance_sessions_updated_at BEFORE
update on attendance_sessions for EACH row
execute FUNCTION update_updated_at_column ();