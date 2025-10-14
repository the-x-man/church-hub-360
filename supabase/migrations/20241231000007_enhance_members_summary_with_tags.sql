-- Enhance members_summary view to include tag information
-- This migration adds tag-related fields to the members_summary view:
-- 1. Aggregated tag names grouped by tag category
-- 2. All assigned tag names as a comma-separated list
-- 3. Tag count for each member
-- 4. Maintains all existing fields from the previous view

-- Drop the existing view
DROP VIEW IF EXISTS public.members_summary;

-- Recreate the view with enhanced tag fields
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
    END as membership_years,
    
    -- Tag information aggregated from member_tag_items
    COALESCE(tag_data.all_tags, '') as assigned_tags,
    COALESCE(tag_data.tag_count, 0) as tag_count,
    COALESCE(tag_data.tags_with_categories, '') as tags_with_categories
FROM public.members m
LEFT JOIN public.branches b ON m.branch_id = b.id
LEFT JOIN (
    -- Subquery to aggregate all tag information per member
    SELECT 
        mti.member_id,
        -- All assigned tag names as comma-separated list
        STRING_AGG(DISTINCT ti.name, ', ' ORDER BY ti.name) as all_tags,
        -- Count of assigned tags
        COUNT(DISTINCT ti.id) as tag_count,
        -- Tags with their categories for structured display (Category: Tag1, Tag2 | Category2: Tag3)
        STRING_AGG(DISTINCT t.name || ': ' || ti.name, ' | ' ORDER BY t.name || ': ' || ti.name) as tags_with_categories
    FROM public.member_tag_items mti
    INNER JOIN public.tag_items ti ON mti.tag_item_id = ti.id AND ti.is_active = true
    INNER JOIN public.tags t ON ti.tag_id = t.id AND t.is_active = true
    GROUP BY mti.member_id
) tag_data ON m.id = tag_data.member_id
WHERE m.is_active = true;

-- Grant permissions on the updated view
GRANT SELECT ON public.members_summary TO authenticated;

-- Update RLS policy for the view
ALTER VIEW public.members_summary SET (security_invoker = true);

-- Add comment to document the enhanced view purpose
COMMENT ON VIEW public.members_summary IS 'Enhanced members summary view including branch information, address fields, and comprehensive tag data aggregated by category for efficient member data access';

-- Create indexes on the underlying tables to improve view performance
CREATE INDEX IF NOT EXISTS idx_member_tag_items_member_id 
    ON public.member_tag_items(member_id);

CREATE INDEX IF NOT EXISTS idx_tag_items_active 
    ON public.tag_items(tag_id, is_active) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tags_active 
    ON public.tags(id, is_active) 
    WHERE is_active = true;

-- Add helpful comments for the new fields
COMMENT ON COLUMN public.members_summary.assigned_tags IS 'Comma-separated list of all tag names assigned to the member';
COMMENT ON COLUMN public.members_summary.tag_count IS 'Total number of tags assigned to the member';
COMMENT ON COLUMN public.members_summary.tags_with_categories IS 'Tags organized by category in format "Category: Tag1, Tag2 | Category2: Tag3" for structured display';