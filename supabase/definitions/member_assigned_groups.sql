create table public.member_assigned_groups (
  id uuid not null default gen_random_uuid (),
  group_id uuid not null,
  member_id uuid not null,
  position character varying(255) null,
  assigned_at timestamp with time zone null default now(),
  assigned_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint member_assigned_groups_pkey primary key (id),
  constraint member_assigned_groups_group_id_member_id_key unique (group_id, member_id),
  constraint fk_member_assigned_committees_assigned_by_auth_users foreign KEY (assigned_by) references auth.users (id) on delete set null,
  constraint member_assigned_committees_assigned_by_fkey foreign KEY (assigned_by) references auth.users (id) on delete set null,
  constraint member_assigned_committees_committee_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
  constraint member_assigned_committees_member_id_fkey foreign KEY (member_id) references members (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_member_assigned_groups_group_id on public.member_assigned_groups using btree (group_id) TABLESPACE pg_default;

create index IF not exists idx_member_assigned_groups_member_id on public.member_assigned_groups using btree (member_id) TABLESPACE pg_default;

create index IF not exists idx_member_assigned_groups_position on public.member_assigned_groups using btree ("position") TABLESPACE pg_default;

create index IF not exists idx_member_assigned_groups_assigned_at on public.member_assigned_groups using btree (assigned_at) TABLESPACE pg_default;

create index IF not exists idx_member_assigned_groups_assigned_by on public.member_assigned_groups using btree (assigned_by) TABLESPACE pg_default;

create trigger update_member_assigned_groups_updated_at BEFORE
update on member_assigned_groups for EACH row
execute FUNCTION update_updated_at_column ();