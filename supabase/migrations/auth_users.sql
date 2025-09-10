create table public.auth_users (
  id uuid not null,
  profile_id uuid not null,
  email text not null,
  is_active boolean null default true,
  is_first_login boolean null default true,
  password_updated boolean null default false,
  last_login timestamp with time zone null,
  otp_requests_count integer null default 0,
  last_otp_request timestamp with time zone null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint auth_users_pkey primary key (id),
   constraint profiles_email_key unique (email),
  constraint auth_users_profile_id_key unique (profile_id),
  constraint auth_users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint auth_users_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_auth_users_profile_id on public.auth_users using btree (profile_id) TABLESPACE pg_default;
create index IF not exists idx_auth_users_email on public.auth_users using btree (email) TABLESPACE pg_default;

create trigger handle_auth_users_updated_at BEFORE
update on auth_users for EACH row
execute FUNCTION handle_updated_at ();

-- Enable RLS
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users all access
CREATE POLICY "Allow authenticated users all access" ON public.auth_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);