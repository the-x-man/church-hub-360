create table public.members (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  branch_id uuid null,
  membership_id character varying(50) not null,
  first_name character varying(100) not null,
  last_name character varying(100) not null,
  middle_name character varying(100) null,
  email character varying(255) null,
  phone character varying(20) null,
  date_of_birth date null,
  gender character varying(20) null,
  marital_status character varying(50) null,
  address_line_1 character varying(255) null,
  address_line_2 character varying(255) null,
  city character varying(100) null,
  state character varying(100) null,
  postal_code character varying(20) null,
  country character varying(100) null,
  membership_status character varying(50) null default 'active'::character varying,
  membership_type character varying(50) null,
  date_joined date null,
  baptism_date date null,
  confirmation_date date null,
  emergency_contact_name character varying(200) null,
  emergency_contact_phone character varying(20) null,
  emergency_contact_relationship character varying(50) null,
  custom_form_data jsonb null default '{}'::jsonb,
  profile_image_url text null,
  notes text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  last_updated_by uuid null,
  constraint members_pkey primary key (id),
  constraint members_organization_id_membership_id_key unique (organization_id, membership_id),
  constraint fk_members_branch_id foreign KEY (branch_id) references branches (id) on delete set null,
  constraint fk_members_organization_id foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint members_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint members_last_updated_by_fkey foreign KEY (last_updated_by) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_members_organization_id on public.members using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_members_branch_id on public.members using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_members_membership_id on public.members using btree (membership_id) TABLESPACE pg_default;

create index IF not exists idx_members_email on public.members using btree (email) TABLESPACE pg_default;

create index IF not exists idx_members_phone on public.members using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_members_membership_status on public.members using btree (membership_status) TABLESPACE pg_default;

create index IF not exists idx_members_is_active on public.members using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_members_form_data on public.members using gin (custom_form_data) TABLESPACE pg_default;

create index IF not exists idx_members_full_name on public.members using btree (first_name, last_name) TABLESPACE pg_default;

create index IF not exists idx_members_date_joined on public.members using btree (date_joined) TABLESPACE pg_default;

create trigger update_members_updated_at BEFORE
update on members for EACH row
execute FUNCTION update_updated_at_column ();