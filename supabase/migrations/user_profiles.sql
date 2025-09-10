create table public.profiles (
  id uuid not null default gen_random_uuid (),
  email text not null,
  first_name text null,
  last_name text null,
  avatar text null,
  phone text null,
  gender text null,
  date_of_birth date null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email)
) TABLESPACE pg_default;

create index IF not exists idx_profiles_email on public.profiles using btree (email) TABLESPACE pg_default;

create index IF not exists idx_profiles_created_at on public.profiles using btree (created_at) TABLESPACE pg_default;

create trigger handle_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION handle_updated_at ();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users all access
CREATE POLICY "Allow authenticated users all access" ON public.profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);