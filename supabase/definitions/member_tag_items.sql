create table public.member_tag_items (
  id uuid not null default gen_random_uuid (),
  member_id uuid not null,
  tag_item_id uuid not null,
  assigned_at timestamp with time zone null default now(),
  assigned_by uuid null,
  constraint member_tag_items_pkey primary key (id),
  constraint member_tag_items_member_id_tag_item_id_key unique (member_id, tag_item_id),
  constraint member_tag_items_assigned_by_fkey2 foreign KEY (assigned_by) references profiles (id) on delete set null,
  constraint member_tag_items_assigned_by_fkey foreign KEY (assigned_by) references auth.users (id),
  constraint member_tag_items_tag_item_id_fkey foreign KEY (tag_item_id) references tag_items (id) on delete CASCADE,
  constraint member_tag_items_member_id_fkey foreign KEY (member_id) references members (id) on delete CASCADE,
  constraint member_tag_items_assigned_by_fkey1 foreign KEY (assigned_by) references auth_users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_member_tag_items_member_id on public.member_tag_items using btree (member_id) TABLESPACE pg_default;

create index IF not exists idx_member_tag_items_tag_item_id on public.member_tag_items using btree (tag_item_id) TABLESPACE pg_default;

create index IF not exists idx_member_tag_items_assigned_at on public.member_tag_items using btree (assigned_at) TABLESPACE pg_default;