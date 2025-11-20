create table public.tags (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  name text not null,
  description text null,
  display_order integer null default 0,
  is_required boolean null default false,
  component_style character varying(20) null default 'dropdown'::character varying,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  last_updated_by uuid null,
  branch_id uuid null,
  constraint tags_pkey primary key (id),
  constraint tags_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint tags_created_by_fkey1 foreign KEY (created_by) references auth_users (id) on delete set null,
  constraint tags_created_by_fkey2 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint tags_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete CASCADE,
  constraint tags_last_updated_by_fkey1 foreign KEY (last_updated_by) references auth_users (id) on delete set null,
  constraint tags_last_updated_by_fkey2 foreign KEY (last_updated_by) references profiles (id) on delete set null,
  constraint tags_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint tags_last_updated_by_fkey foreign KEY (last_updated_by) references auth.users (id),
  constraint tags_component_style_check check (
    (
      (component_style)::text = any (
        (
          array[
            'dropdown'::character varying,
            'multiselect'::character varying,
            'checkbox'::character varying,
            'radio'::character varying,
            'list'::character varying,
            'badge'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_tags_organization_id on public.tags using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_tags_name on public.tags using btree (name) TABLESPACE pg_default;

create index IF not exists idx_tags_component_style on public.tags using btree (component_style) TABLESPACE pg_default;

create index IF not exists idx_tags_is_active on public.tags using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_tags_display_order on public.tags using btree (display_order) TABLESPACE pg_default;

create index IF not exists idx_tags_active on public.tags using btree (id, is_active) TABLESPACE pg_default
where
  (is_active = true);

create trigger trigger_cleanup_tag_assignments
after
update OF is_active on tags for EACH row when (old.is_active is distinct from new.is_active)
execute FUNCTION cleanup_tag_assignments ();

create trigger update_tags_updated_at BEFORE
update on tags for EACH row
execute FUNCTION update_updated_at_column ();