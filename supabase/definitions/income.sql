create table public.income (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  branch_id uuid null,
  amount numeric(12, 2) not null,
  description text null,
  notes text null,
  date timestamp with time zone not null default now(),
  created_by uuid null,
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  income_type text not null default 'general_income'::text,
  category text null,
  occasion_name text null,
  attendance_occasion_id uuid null,
  attendance_session_id uuid null,
  source_type text not null default 'church'::text,
  member_id uuid null,
  group_id uuid null,
  tag_item_id uuid null,
  payment_method text not null,
  receipt_number text null,
  is_deleted boolean not null default false,
  envelope_number text null,
  receipt_issued boolean null default false,
  source text null,
  tax_deductible boolean null default false,
  constraint income_pkey primary key (id),
  constraint income_attendance_session_id_fkey foreign KEY (attendance_session_id) references attendance_sessions (id) on delete set null,
  constraint income_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete set null,
  constraint income_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint income_created_by_fkey1 foreign KEY (created_by) references auth_users (id) on delete set null,
  constraint income_created_by_fkey2 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint income_group_id_fkey foreign KEY (group_id) references groups (id) on delete set null,
  constraint income_member_id_fkey foreign KEY (member_id) references members (id) on delete set null,
  constraint income_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint income_attendance_occasion_id_fkey foreign KEY (attendance_occasion_id) references attendance_occasions (id) on delete set null,
  constraint income_tag_item_id_fkey foreign KEY (tag_item_id) references tag_items (id) on delete set null,
  constraint income_income_type_check check (
    (
      income_type = any (
        array[
          'general_income'::text,
          'contribution'::text,
          'donation'::text,
          'pledge_payment'::text
        ]
      )
    )
  ),
  constraint income_source_type_check check (
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
  ),
  constraint income_payment_method_check check (
    (
      payment_method = any (
        array[
          'cash'::text,
          'check'::text,
          'credit_card'::text,
          'debit_card'::text,
          'bank_transfer'::text,
          'mobile_payment'::text,
          'online'::text,
          'other'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_income_receipt_per_org on public.income using btree (organization_id, receipt_number) TABLESPACE pg_default
where
  (receipt_number is not null);

create index IF not exists idx_income_org on public.income using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_income_branch on public.income using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_income_member on public.income using btree (member_id) TABLESPACE pg_default;

create index IF not exists idx_income_type on public.income using btree (income_type) TABLESPACE pg_default;

create index IF not exists idx_income_date on public.income using btree (date) TABLESPACE pg_default;

create index IF not exists idx_income_source_type on public.income using btree (source_type) TABLESPACE pg_default;

create trigger update_income_updated_at BEFORE
update on income for EACH row
execute FUNCTION handle_updated_at ();