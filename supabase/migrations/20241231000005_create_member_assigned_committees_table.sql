-- Create member_assigned_committees table for managing committee member assignments
CREATE TABLE IF NOT EXISTS public.member_assigned_committees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    
    -- Assignment details
    position VARCHAR(255),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique assignment per member and committee
    UNIQUE(committee_id, member_id)
);

-- Add additional foreign key constraints for assigned_by
-- These reference multiple possible user tables as specified
ALTER TABLE public.member_assigned_committees ADD CONSTRAINT fk_member_assigned_committees_assigned_by_auth_users
    FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_assigned_committees_committee_id ON public.member_assigned_committees(committee_id);
CREATE INDEX IF NOT EXISTS idx_member_assigned_committees_member_id ON public.member_assigned_committees(member_id);
CREATE INDEX IF NOT EXISTS idx_member_assigned_committees_position ON public.member_assigned_committees(position);
CREATE INDEX IF NOT EXISTS idx_member_assigned_committees_assigned_at ON public.member_assigned_committees(assigned_at);
CREATE INDEX IF NOT EXISTS idx_member_assigned_committees_assigned_by ON public.member_assigned_committees(assigned_by);

-- Create trigger for updated_at column
CREATE TRIGGER update_member_assigned_committees_updated_at 
    BEFORE UPDATE ON public.member_assigned_committees 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.member_assigned_committees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users full access to member_assigned_committees" 
    ON public.member_assigned_committees 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Create view for committee members with member details
CREATE OR REPLACE VIEW public.committee_members_view AS
SELECT 
    mac.id as assignment_id,
    mac.committee_id,
    mac.member_id,
    mac.position,
    mac.assigned_at,
    mac.assigned_by,
    c.name as committee_name,
    c.description as committee_description,
    c.type as committee_type,
    c.is_active as committee_is_active,
    c.is_closed as committee_is_closed,
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
FROM public.member_assigned_committees mac
JOIN public.committees c ON mac.committee_id = c.id
JOIN public.members m ON mac.member_id = m.id
WHERE c.is_active = true AND m.is_active = true;

-- Grant permissions on the view
GRANT SELECT ON public.committee_members_view TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.committee_members_view SET (security_invoker = true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_assigned_committees TO authenticated;