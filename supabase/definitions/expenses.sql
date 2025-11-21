create table public.expenses (
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
  vendor text null,
  receipt_number text null,
  payment_method text not null,
  approved_by uuid null,
  approval_date timestamp with time zone null,
  is_deleted boolean not null default false,
  purpose text null,
  "Category" text null,
  constraint expenses_pkey primary key (id),
  constraint expenses_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete set null,
  constraint expenses_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint expenses_created_by_fkey1 foreign KEY (created_by) references auth_users (id) on update CASCADE on delete set null,
  constraint expenses_approved_by_fkey1 foreign KEY (approved_by) references members (id),
  constraint expenses_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint expenses_created_by_fkey2 foreign KEY (created_by) references profiles (id) on update CASCADE on delete set null,
  constraint expenses_payment_method_check check (
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

create index IF not exists idx_expenses_org on public.expenses using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_expenses_branch on public.expenses using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_expenses_date on public.expenses using btree (date) TABLESPACE pg_default;

create trigger update_expenses_updated_at BEFORE
update on expenses for EACH row
execute FUNCTION handle_updated_at ();