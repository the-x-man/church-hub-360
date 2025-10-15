-- Create attendance_occasions table
-- Stores general recurring or permanent occasions (e.g., "Sunday Service", "Youth Meeting", "Bible Studies")

create table public.attendance_occasions (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  branch_id uuid null,
  name text not null,
  description text null,
  recurrence_rule text null,
  default_duration_minutes integer null,
  is_active boolean not null default true,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  last_updated_by uuid null,
  constraint attendance_occasions_pkey primary key (id),
  constraint attendance_occasions_created_by_fkey foreign KEY (created_by) references auth_users (id) on delete RESTRICT,
  constraint attendance_occasions_created_by_fkey1 foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint attendance_occasions_created_by_fkey2 foreign KEY (created_by) references profiles (id) on delete set null,
  constraint attendance_occasions_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete CASCADE,
  constraint attendance_occasions_last_updated_by_fkey1 foreign KEY (last_updated_by) references auth_users (id) on delete set null,
  constraint attendance_occasions_last_updated_by_fkey2 foreign KEY (last_updated_by) references auth.users (id) on delete set null,
  constraint attendance_occasions_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint attendance_occasions_last_updated_by_fkey foreign KEY (last_updated_by) references profiles (id) on delete set null
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_occasions_organization_id ON attendance_occasions(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_occasions_branch_id ON attendance_occasions(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_occasions_is_active ON attendance_occasions(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_occasions_created_by ON attendance_occasions(created_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attendance_occasions_updated_at
    BEFORE UPDATE ON attendance_occasions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE attendance_occasions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view occasions from their organization
CREATE POLICY "Users can view occasions from their organization" ON attendance_occasions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert occasions for their organization
CREATE POLICY "Users can insert occasions for their organization" ON attendance_occasions
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- Policy: Users can update occasions they created in their organization
CREATE POLICY "Users can update occasions they created in their organization" ON attendance_occasions
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- Policy: Users can delete occasions they created in their organization
CREATE POLICY "Users can delete occasions they created in their organization" ON attendance_occasions
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- Add some sample data for testing (optional)
INSERT INTO attendance_occasions (organization_id, name, description, recurrence_rule, default_duration_minutes, created_by)
SELECT 
    o.id as organization_id,
    'Sunday Morning Service' as name,
    'Main worship service on Sunday mornings' as description,
    'FREQ=WEEKLY;BYDAY=SU' as recurrence_rule,
    90 as default_duration_minutes,
    u.id as created_by
FROM organizations o
CROSS JOIN users u
WHERE o.name = 'Default Organization' 
AND u.email = 'admin@example.com'
LIMIT 1;

INSERT INTO attendance_occasions (organization_id, name, description, recurrence_rule, default_duration_minutes, created_by)
SELECT 
    o.id as organization_id,
    'Wednesday Bible Study' as name,
    'Mid-week Bible study and prayer meeting' as description,
    'FREQ=WEEKLY;BYDAY=WE' as recurrence_rule,
    60 as default_duration_minutes,
    u.id as created_by
FROM organizations o
CROSS JOIN users u
WHERE o.name = 'Default Organization' 
AND u.email = 'admin@example.com'
LIMIT 1;