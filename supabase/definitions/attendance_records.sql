create table public.attendance_records (
  id uuid not null default gen_random_uuid (),
  session_id uuid not null,
  member_id uuid not null,
  marked_by uuid null,
  marked_by_mode text not null,
  marked_at timestamp with time zone not null default now(),
  location jsonb null,
  notes text null,
  is_valid boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint attendance_records_pkey primary key (id),
  constraint attendance_records_marked_by_fkey foreign KEY (marked_by) references profiles (id) on delete set null,
  constraint attendance_records_member_id_fkey foreign KEY (member_id) references members (id) on delete RESTRICT,
  constraint attendance_records_session_id_fkey foreign KEY (session_id) references attendance_sessions (id) on delete CASCADE,
  constraint attendance_records_marked_by_mode_check check (
    (
      marked_by_mode = any (
        array[
          'email'::text,
          'phone'::text,
          'membership_id'::text,
          'manual'::text
        ]
      )
    )
  ),
  constraint attendance_records_valid_location check (
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
          ((location ? 'accuracy'::text) is false)
          or (
            ((location ->> 'accuracy'::text))::numeric > (0)::numeric
          )
        )
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_attendance_records_member_id on public.attendance_records using btree (member_id) TABLESPACE pg_default;

create unique INDEX IF not exists attendance_records_session_member_unique on public.attendance_records using btree (session_id, member_id) TABLESPACE pg_default;

create index IF not exists idx_attendance_records_session_id on public.attendance_records using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_attendance_records_marked_at on public.attendance_records using btree (marked_at) TABLESPACE pg_default;

create index IF not exists idx_attendance_records_marked_by on public.attendance_records using btree (marked_by) TABLESPACE pg_default;

create index IF not exists idx_attendance_records_is_valid on public.attendance_records using btree (is_valid) TABLESPACE pg_default
where
  (is_valid = true);

create trigger update_attendance_records_updated_at BEFORE
update on attendance_records for EACH row
execute FUNCTION update_updated_at_column ();