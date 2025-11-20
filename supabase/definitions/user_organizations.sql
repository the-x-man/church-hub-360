create table public.user_organizations (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  organization_id uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_active boolean null default true,
  created_by uuid null,
  role text null,
  visibility_overrides jsonb null default '{}'::jsonb,
  can_create_users boolean null default true,
  constraint user_organizations_pkey primary key (id),
  constraint user_organizations_user_id_organization_id_key unique (user_id, organization_id),
  constraint user_organizations_created_by_fkey2 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint user_organizations_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint user_organizations_created_by_fkey1 foreign KEY (created_by) references auth_users (id) on delete set null,
  constraint user_organizations_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_organizations_user_id_fkey1 foreign KEY (user_id) references profiles (id) on delete set null,
  constraint user_organizations_user_id_fkey2 foreign KEY (user_id) references auth_users (id) on delete set null,
  constraint user_organizations_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_user_organizations_created_by on public.user_organizations using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_user_organizations_organization_id on public.user_organizations using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_user_organizations_user_id on public.user_organizations using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_organizations_user_id_auth_users on public.user_organizations using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_organizations_user_id_profiles on public.user_organizations using btree (user_id) TABLESPACE pg_default;

create index IF not exists user_organizations_created_by_idx on public.user_organizations using btree (created_by) TABLESPACE pg_default;

create trigger trigger_update_is_active_on_delete
after DELETE on user_organizations for EACH row
execute FUNCTION update_auth_users_is_active ();

create trigger trigger_update_is_active_on_insert
after INSERT on user_organizations for EACH row
execute FUNCTION update_auth_users_is_active ();

create trigger trigger_update_is_active_on_update
after
update on user_organizations for EACH row
execute FUNCTION update_auth_users_is_active ();

create trigger trigger_update_is_owner_on_delete
after DELETE on user_organizations for EACH row
execute FUNCTION update_auth_users_is_owner ();

create trigger trigger_update_is_owner_on_insert
after INSERT on user_organizations for EACH row
execute FUNCTION update_auth_users_is_owner ();

create trigger trigger_update_is_owner_on_update
after
update on user_organizations for EACH row
execute FUNCTION update_auth_users_is_owner ();

create trigger update_user_organizations_updated_at BEFORE
update on user_organizations for EACH row
execute FUNCTION handle_updated_at ();