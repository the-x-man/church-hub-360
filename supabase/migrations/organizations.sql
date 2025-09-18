-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  logo TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  currency TEXT DEFAULT 'GHS',
  logo_settings JSONB DEFAULT '{}',
  brand_colors JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE
);

-- Create user_organizations table
create table public.user_organizations (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  organization_id uuid not null,
  role text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_active boolean null default true,
  created_by uuid null,
  constraint user_organizations_pkey primary key (id),
  constraint user_organizations_user_id_organization_id_key unique (user_id, organization_id),
  constraint user_organizations_created_by_fkey2 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint user_organizations_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint user_organizations_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_organizations_user_id_fkey1 foreign KEY (user_id) references profiles (id) on delete set null,
  constraint user_organizations_user_id_fkey2 foreign KEY (user_id) references auth_users (id) on delete set null,
  constraint user_organizations_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint user_organizations_created_by_fkey1 foreign KEY (created_by) references auth_users (id) on delete set null,
  constraint user_organizations_role_check check (
    (
      role = any (
        array[
          'owner'::text,
          'admin'::text,
          'branch_admin'::text,
          'write'::text,
          'read'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_organization_id ON user_organizations(organization_id);
CREATE INDEX idx_user_organizations_user_id_profiles ON user_organizations(user_id); -- For profiles relationship
CREATE INDEX idx_user_organizations_user_id_auth_users ON user_organizations(user_id); -- For auth_users relationship
CREATE INDEX idx_organizations_name ON organizations(name);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all access to authenticated users by default
CREATE POLICY "Allow all access to authenticated users" ON organizations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all access to authenticated users" ON user_organizations
  FOR ALL USING (auth.role() = 'authenticated');

-- Triggers to automatically update updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_user_organizations_updated_at
  BEFORE UPDATE ON user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert default notification settings for existing organizations
UPDATE organizations 
SET notification_settings = '{
  "roleChanges": true,
  "securityAlerts": true,
  "appUpdates": true,
  "newUserAdded": true
}'
WHERE notification_settings = '{}';

-- Insert default brand colors for existing organizations
UPDATE organizations 
SET brand_colors = '{
  "light": {
    "primary": "#3b82f6",
    "secondary": "#64748b",
    "accent": "#06b6d4"
  },
  "dark": {
    "primary": "#60a5fa",
    "secondary": "#94a3b8",
    "accent": "#22d3ee"
  }
}'
WHERE brand_colors = '{}';

-- Insert default logo settings for existing organizations
UPDATE organizations 
SET logo_settings = '{
  "orientation": "horizontal",
  "backgroundSize": "contain"
}'
WHERE logo_settings = '{}';