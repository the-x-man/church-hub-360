create table public.tag_items (
  id uuid not null default gen_random_uuid (),
  tag_id uuid not null,
  name text not null,
  description text null,
  color character varying(7) null default '#6B7280'::character varying,
  display_order integer null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  last_updated_by uuid null,
  constraint tag_items_pkey primary key (id),
  constraint tag_items_tag_id_name_key unique (tag_id, name),
  constraint tag_items_created_by_fkey2 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint tag_items_last_updated_by_fkey foreign KEY (last_updated_by) references auth.users (id),
  constraint tag_items_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint tag_items_last_updated_by_fkey2 foreign KEY (last_updated_by) references profiles (id) on delete set null,
  constraint tag_items_tag_id_fkey foreign KEY (tag_id) references tags (id) on delete CASCADE,
  constraint tag_items_last_updated_by_fkey1 foreign KEY (last_updated_by) references auth_users (id) on delete set null,
  constraint tag_items_created_by_fkey1 foreign KEY (created_by) references auth_users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_tag_items_is_active on public.tag_items using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_tag_items_display_order on public.tag_items using btree (display_order) TABLESPACE pg_default;

create index IF not exists idx_tag_items_tag_id on public.tag_items using btree (tag_id) TABLESPACE pg_default;

create index IF not exists idx_tag_items_name on public.tag_items using btree (name) TABLESPACE pg_default;

create index IF not exists idx_tag_items_active on public.tag_items using btree (tag_id, is_active) TABLESPACE pg_default
where
  (is_active = true);

create trigger update_tag_items_updated_at BEFORE
update on tag_items for EACH row
execute FUNCTION update_updated_at_column ();