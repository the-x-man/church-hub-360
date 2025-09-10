create table public.app_versions (
  id uuid not null default gen_random_uuid (),
  version character varying(50) not null,
  release_notes text null,
  download_url text not null,
  file_size bigint not null default 0,
  platform character varying(20) not null default 'win32'::character varying,
  status character varying(20) not null default 'draft'::character varying,
  is_critical boolean null default false,
  minimum_version character varying(50) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  published_at timestamp with time zone null,
  created_by uuid null,
  is_latest boolean not null default false,
  architecture text null,
  constraint app_versions_pkey primary key (id),
  constraint app_versions_version_platform_key unique (version, platform),
  constraint app_versions_created_by_fkey foreign KEY (created_by) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_app_versions_status on public.app_versions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_app_versions_platform on public.app_versions using btree (platform) TABLESPACE pg_default;

create index IF not exists idx_app_versions_created_at on public.app_versions using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_app_versions_version on public.app_versions using btree (version) TABLESPACE pg_default;

create index IF not exists idx_app_versions_is_latest on public.app_versions using btree (is_latest, platform, status) TABLESPACE pg_default;

create trigger set_app_versions_published_at BEFORE
update on app_versions for EACH row
execute FUNCTION set_published_at ();

create trigger update_app_versions_updated_at BEFORE
update on app_versions for EACH row
execute FUNCTION handle_updated_at ();

-- Enable RLS
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users all access
CREATE POLICY "Allow authenticated users all access" ON public.app_versions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);