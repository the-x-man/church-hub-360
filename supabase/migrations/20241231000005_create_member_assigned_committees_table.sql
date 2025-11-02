-- Create member_assigned_groups table for managing group member assignments
CREATE TABLE IF NOT EXISTS public.member_assigned_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    
    -- Assignment details
    position VARCHAR(255),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique assignment per member and group
    UNIQUE(group_id, member_id)
);

-- Add additional foreign key constraints for assigned_by
-- These reference multiple possible user tables as specified
ALTER TABLE public.member_assigned_groups ADD CONSTRAINT fk_member_assigned_groups_assigned_by_auth_users
    FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_assigned_groups_group_id ON public.member_assigned_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_member_assigned_groups_member_id ON public.member_assigned_groups(member_id);
CREATE INDEX IF NOT EXISTS idx_member_assigned_groups_position ON public.member_assigned_groups(position);
CREATE INDEX IF NOT EXISTS idx_member_assigned_groups_assigned_at ON public.member_assigned_groups(assigned_at);
CREATE INDEX IF NOT EXISTS idx_member_assigned_groups_assigned_by ON public.member_assigned_groups(assigned_by);

-- Create trigger for updated_at column
CREATE TRIGGER update_member_assigned_groups_updated_at 
    BEFORE UPDATE ON public.member_assigned_groups 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.member_assigned_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users full access to member_assigned_groups" 
    ON public.member_assigned_groups 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Create view for group members with member details
CREATE OR REPLACE VIEW public.group_members_view AS
SELECT 
    mag.id as assignment_id,
    mag.group_id,
    mag.member_id,
    mag.position,
    mag.assigned_at,
    mag.assigned_by,
    g.name as group_name,
    g.description as group_description,
    g.type as group_type,
    g.is_active as group_is_active,
    g.is_closed as group_is_closed,
    m.first_name,
    m.last_name,
    m.middle_name,
    CONCAT(m.first_name, ' ', COALESCE(m.middle_name || ' ', ''), m.last_name) as member_full_name,
    m.email as member_email,
    m.phone as member_phone,
    m.membership_id,
    m.membership_status,
    m.profile_image_url,
    m.is_active as member_is_active
FROM public.member_assigned_groups mag
JOIN public.groups g ON mag.group_id = g.id
JOIN public.members m ON mag.member_id = m.id
WHERE g.is_active = true AND m.is_active = true;

-- Grant permissions on the view
GRANT SELECT ON public.group_members_view TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.group_members_view SET (security_invoker = true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_assigned_groups TO authenticated;
