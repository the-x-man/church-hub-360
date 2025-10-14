-- Update members_summary view to include branch name and address fields
-- This migration enhances the members_summary view to include:
-- 1. Branch name via JOIN with branches table
-- 2. Address fields from the members table
-- 3. Maintains all existing fields and calculations

-- Drop the existing view
DROP VIEW IF EXISTS public.members_summary;

-- Recreate the view with enhanced fields
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
    
    -- Address fields
    m.address_line_1,
    m.address_line_2,
    m.city,
    m.state,
    m.postal_code,
    m.country,
    
    -- Branch information via JOIN
    b.name as branch_name,
    b.location as branch_location,
    
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
LEFT JOIN public.branches b ON m.branch_id = b.id
WHERE m.is_active = true;

-- Grant permissions on the updated view
GRANT SELECT ON public.members_summary TO authenticated;

-- Update RLS policy for the view
ALTER VIEW public.members_summary SET (security_invoker = true);

-- Add comment to document the view purpose
COMMENT ON VIEW public.members_summary IS 'Enhanced members summary view including branch information and address fields for comprehensive member data access';