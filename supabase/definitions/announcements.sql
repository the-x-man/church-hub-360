create table public.announcements (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  title text not null,
  description text not null,
  is_deleted boolean not null default false,
  created_by uuid null,
  last_updated_by uuid null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  branch_id uuid null,
  slides text null,
  constraint announcements_pkey primary key (id),
  constraint announcements_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint announcements_created_by_fkey1 foreign KEY (created_by) references auth_users (id) on delete set null,
  constraint announcements_created_by_fkey2 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint announcements_last_updated_by_fkey foreign KEY (last_updated_by) references auth.users (id) on delete set null,
  constraint announcements_last_updated_by_fkey1 foreign KEY (last_updated_by) references auth_users (id) on delete set null,
  constraint announcements_last_updated_by_fkey2 foreign KEY (last_updated_by) references profiles (id) on delete set null,
  constraint announcements_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint announcements_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete CASCADE,
  constraint announcements_title_check check ((char_length(title) <= 100))
) TABLESPACE pg_default;

create index IF not exists idx_announcements_org on public.announcements using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_announcements_created_at on public.announcements using btree (created_at) TABLESPACE pg_default;

create trigger update_announcements_updated_at BEFORE
update on announcements for EACH row
execute FUNCTION handle_updated_at ();