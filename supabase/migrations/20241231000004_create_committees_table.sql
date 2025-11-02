-- Create groups table for managing church groups
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    branch_id UUID,
    
    -- Group basic information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Group type and dates
    type VARCHAR(20) DEFAULT 'permanent' CHECK (type IN ('permanent', 'temporal')),
    start_date DATE,
    end_date DATE,
    
    -- Status flags
    is_closed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    last_updated_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique group names per organization
    UNIQUE(organization_id, name)
);

-- Add foreign key constraints
ALTER TABLE public.groups ADD CONSTRAINT fk_groups_organization_id 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.groups ADD CONSTRAINT fk_groups_branch_id 
    FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add additional foreign key constraints for created_by and last_updated_by
-- These reference multiple possible user tables as specified
ALTER TABLE public.groups ADD CONSTRAINT fk_groups_created_by_auth_users
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.groups ADD CONSTRAINT fk_groups_last_updated_by_auth_users
    FOREIGN KEY (last_updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_organization_id ON public.groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_groups_branch_id ON public.groups(branch_id);
CREATE INDEX IF NOT EXISTS idx_groups_name ON public.groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_type ON public.groups(type);
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON public.groups(is_active);
CREATE INDEX IF NOT EXISTS idx_groups_is_closed ON public.groups(is_closed);
CREATE INDEX IF NOT EXISTS idx_groups_start_date ON public.groups(start_date);
CREATE INDEX IF NOT EXISTS idx_groups_end_date ON public.groups(end_date);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_last_updated_by ON public.groups(last_updated_by);

-- Create trigger for updated_at column
CREATE TRIGGER update_groups_updated_at 
    BEFORE UPDATE ON public.groups 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users full access to groups" 
    ON public.groups 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Create function to automatically mark groups as ended when end date is due
CREATE OR REPLACE FUNCTION public.mark_groups_as_ended()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.groups    
    SET is_closed = true,
        updated_at = NOW()
    WHERE type = 'temporal' 
      AND end_date IS NOT NULL 
      AND end_date <= CURRENT_DATE 
      AND is_closed = false 
      AND is_active = true;
END;
$$;

-- Create a scheduled job to run the function daily (this would typically be set up separately)
-- For now, we'll create the function and it can be called manually or via a cron job

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
