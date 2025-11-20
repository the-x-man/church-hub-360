create table public.events_activities (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  branch_id uuid null,
  title text not null,
  description text null,
  type text not null default 'event'::text,
  category text null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone null,
  all_day boolean not null default false,
  location text null,
  remind_at timestamp with time zone null,
  remind_method text not null default 'none'::text,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  created_by uuid null,
  last_updated_by uuid null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint events_activities_pkey primary key (id),
  constraint events_activities_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint events_activities_created_by_fkey1 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint events_activities_created_by_fkey2 foreign KEY (created_by) references auth_users (id) on delete set null,
  constraint events_activities_last_updated_by_fkey foreign KEY (last_updated_by) references auth.users (id) on delete set null,
  constraint events_activities_last_updated_by_fkey1 foreign KEY (last_updated_by) references auth_users (id) on delete set null,
  constraint events_activities_last_updated_by_fkey2 foreign KEY (last_updated_by) references profiles (id) on delete set null,
  constraint events_activities_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint events_activities_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete set null,
  constraint events_activities_remind_method_check check (
    (
      remind_method = any (
        array[
          'none'::text,
          'email'::text,
          'push'::text,
          'sms'::text
        ]
      )
    )
  ),
  constraint events_activities_type_check check (
    (
      type = any (
        array[
          'event'::text,
          'activity'::text,
          'announcement'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_events_org on public.events_activities using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_events_branch on public.events_activities using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_events_type on public.events_activities using btree (type) TABLESPACE pg_default;

create index IF not exists idx_events_start on public.events_activities using btree (start_time) TABLESPACE pg_default;

create index IF not exists idx_events_end on public.events_activities using btree (end_time) TABLESPACE pg_default;

create index IF not exists idx_events_active on public.events_activities using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_events_not_deleted on public.events_activities using btree (is_deleted) TABLESPACE pg_default;

create trigger update_events_activities_updated_at BEFORE
update on events_activities for EACH row
execute FUNCTION handle_updated_at ();