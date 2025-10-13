-- Create committees table for managing church committees
CREATE TABLE IF NOT EXISTS public.committees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    branch_id UUID,
    
    -- Committee basic information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Committee type and dates
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
    
    -- Ensure unique committee names per organization
    UNIQUE(organization_id, name)
);

-- Add foreign key constraints
ALTER TABLE public.committees ADD CONSTRAINT fk_committees_organization_id 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.committees ADD CONSTRAINT fk_committees_branch_id 
    FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

-- Add additional foreign key constraints for created_by and last_updated_by
-- These reference multiple possible user tables as specified
ALTER TABLE public.committees ADD CONSTRAINT fk_committees_created_by_auth_users
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.committees ADD CONSTRAINT fk_committees_last_updated_by_auth_users
    FOREIGN KEY (last_updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_committees_organization_id ON public.committees(organization_id);
CREATE INDEX IF NOT EXISTS idx_committees_branch_id ON public.committees(branch_id);
CREATE INDEX IF NOT EXISTS idx_committees_name ON public.committees(name);
CREATE INDEX IF NOT EXISTS idx_committees_type ON public.committees(type);
CREATE INDEX IF NOT EXISTS idx_committees_is_active ON public.committees(is_active);
CREATE INDEX IF NOT EXISTS idx_committees_is_closed ON public.committees(is_closed);
CREATE INDEX IF NOT EXISTS idx_committees_start_date ON public.committees(start_date);
CREATE INDEX IF NOT EXISTS idx_committees_end_date ON public.committees(end_date);
CREATE INDEX IF NOT EXISTS idx_committees_created_by ON public.committees(created_by);
CREATE INDEX IF NOT EXISTS idx_committees_last_updated_by ON public.committees(last_updated_by);

-- Create trigger for updated_at column
CREATE TRIGGER update_committees_updated_at 
    BEFORE UPDATE ON public.committees 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users full access to committees" 
    ON public.committees 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Create function to automatically mark committees as ended when end date is due
CREATE OR REPLACE FUNCTION public.mark_committees_as_ended()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.committees 
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.committees TO authenticated;