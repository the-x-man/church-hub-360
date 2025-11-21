create table public.pledge_payments (
  id uuid not null default gen_random_uuid (),
  pledge_id uuid not null,
  amount numeric(12, 2) not null,
  payment_date timestamp with time zone not null default now(),
  payment_method text not null,
  notes text null,
  created_by uuid null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  is_deleted boolean null default false,
  organization_id uuid not null,
  branch_id uuid null,
  constraint pledge_payments_pkey primary key (id),
  constraint pledge_payments_branch_id_fkey foreign KEY (branch_id) references branches (id),
  constraint pledge_payments_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint pledge_payments_created_by_fkey1 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint pledge_payments_created_by_fkey2 foreign KEY (created_by) references auth_users (id) on delete set null,
  constraint pledge_payments_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint pledge_payments_pledge_id_fkey foreign KEY (pledge_id) references pledge_records (id) on delete CASCADE,
  constraint fk_pledge_payments_org foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint pledge_payments_payment_method_check check (
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

create index IF not exists idx_pledge_payments_pledge on public.pledge_payments using btree (pledge_id) TABLESPACE pg_default;

create index IF not exists idx_pledge_payments_date on public.pledge_payments using btree (payment_date) TABLESPACE pg_default;

create index IF not exists idx_pledge_payments_org on public.pledge_payments using btree (organization_id) TABLESPACE pg_default;

create trigger sync_pledge_totals_after_delete
after DELETE on pledge_payments for EACH row
execute FUNCTION sync_pledge_totals_from_payments ();

create trigger sync_pledge_totals_after_insert
after INSERT on pledge_payments for EACH row
execute FUNCTION sync_pledge_totals_from_payments ();

create trigger sync_pledge_totals_after_update
after
update on pledge_payments for EACH row
execute FUNCTION sync_pledge_totals_from_payments ();