create table public.pledge_records (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  branch_id uuid null,
  member_id uuid null,
  pledge_amount numeric(12, 2) not null,
  amount_paid numeric(12, 2) not null default 0,
  amount_remaining numeric(12, 2) not null default 0,
  campaign_name text null,
  start_date date not null,
  end_date date not null,
  status text not null default 'active'::text,
  description text null,
  created_by uuid null,
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  is_deleted boolean not null default false,
  source_type text not null default 'member'::text,
  group_id uuid null,
  tag_item_id uuid null,
  source text null,
  pledge_type text null,
  payment_frequency text null,
  constraint pledge_records_pkey primary key (id),
  constraint pledge_records_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint pledge_records_created_by_fkey1 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint pledge_records_created_by_fkey2 foreign KEY (created_by) references auth_users (id) on delete set null,
  constraint pledge_records_group_id_fkey foreign KEY (group_id) references groups (id) on delete set null,
  constraint pledge_records_member_id_fkey foreign KEY (member_id) references members (id) on delete CASCADE,
  constraint pledge_records_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint pledge_records_tag_item_id_fkey foreign KEY (tag_item_id) references tag_items (id) on delete set null,
  constraint pledge_records_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete set null,
  constraint pledge_records_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'fulfilled'::text,
          'cancelled'::text,
          'overdue'::text
        ]
      )
    )
  ),
  constraint pledge_records_source_type_check check (
    (
      source_type = any (
        array[
          'church'::text,
          'member'::text,
          'tag_item'::text,
          'group'::text,
          'other'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_pledge_records_org on public.pledge_records using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_pledge_records_member on public.pledge_records using btree (member_id) TABLESPACE pg_default;

create index IF not exists idx_pledge_records_status on public.pledge_records using btree (status) TABLESPACE pg_default;

create index IF not exists idx_pledge_records_source_type on public.pledge_records using btree (source_type) TABLESPACE pg_default;

create index IF not exists idx_pledge_records_group on public.pledge_records using btree (group_id) TABLESPACE pg_default;

create index IF not exists idx_pledge_records_tag_item on public.pledge_records using btree (tag_item_id) TABLESPACE pg_default;

create trigger update_pledge_records_updated_at BEFORE
update on pledge_records for EACH row
execute FUNCTION handle_updated_at ();