-- Create members table for managing church members
CREATE TABLE IF NOT EXISTS public.members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    branch_id UUID,
    
    -- Basic member information
    membership_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(50),
    
    -- Address information
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Membership details
    membership_status VARCHAR(50) DEFAULT 'active',
    membership_type VARCHAR(50),
    date_joined DATE,
    baptism_date DATE,
    confirmation_date DATE,
    
    -- Emergency contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Additional form data from membership form schema
    custom_form_data JSONB DEFAULT '{}',
    
    -- Profile and preferences
    profile_image_url TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    last_updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(organization_id, membership_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_organization_id ON public.members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_branch_id ON public.members(branch_id);
CREATE INDEX IF NOT EXISTS idx_members_membership_id ON public.members(membership_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON public.members(membership_status);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON public.members(is_active);
CREATE INDEX IF NOT EXISTS idx_members_custom_form_data ON public.members USING GIN (custom_form_data);
CREATE INDEX IF NOT EXISTS idx_members_full_name ON public.members(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_members_date_joined ON public.members(date_joined);

-- Create triggers for updated_at
CREATE TRIGGER update_members_updated_at 
    BEFORE UPDATE ON public.members 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users full access to members" 
    ON public.members 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Add foreign key constraints (assuming organizations and branches tables exist)
-- Note: These will be added when the referenced tables are available
ALTER TABLE public.members ADD CONSTRAINT fk_members_organization_id 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.members ADD CONSTRAINT fk_members_branch_id 
    FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

-- Create view for member summary information
CREATE OR REPLACE VIEW public.members_summary AS
SELECT 
    m.id,
    m.organization_id,
    m.branch_id,
    m.membership_id,
    m.first_name,
    m.last_name,
    m.middle_name,
    CONCAT(m.first_name, ' ', COALESCE(m.middle_name || ' ', ''), m.last_name) as full_name,
    m.email,
    m.phone,
    m.date_of_birth,
    m.gender,
    m.membership_status,
    m.membership_type,
    m.date_joined,
    m.is_active,
    m.profile_image_url,
    m.created_at,
    m.updated_at,
    -- Calculate age
    CASE 
        WHEN m.date_of_birth IS NOT NULL THEN 
            DATE_PART('year', AGE(m.date_of_birth))
        ELSE NULL 
    END as age,
    -- Calculate membership duration in years
    CASE 
        WHEN m.date_joined IS NOT NULL THEN 
            DATE_PART('year', AGE(m.date_joined))
        ELSE NULL 
    END as membership_years
FROM public.members m
WHERE m.is_active = true;

-- Grant permissions on the view
GRANT SELECT ON public.members_summary TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.members_summary SET (security_invoker = true);