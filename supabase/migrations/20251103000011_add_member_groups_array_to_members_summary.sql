-- Add member_groups text array column to members_summary view
-- This migration enhances the members_summary view by adding a member_groups column
-- containing all assigned groups formatted as 'Group Name - Position' in a PostgreSQL
-- text array for efficient filtering and indexing capabilities.

-- Drop the existing view
DROP VIEW IF EXISTS public.members_summary;

-- Recreate the view with the new member_groups column (preserving existing tag fields)
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
    COALESCE(tag_data.tags_with_categories, '') as tags_with_categories,
    
    -- Tags as text array for efficient filtering and indexing
    COALESCE(tag_data.tags_array, ARRAY[]::text[]) as tags_array,

    -- NEW: Member groups as text array in format 'Group Name - Position'
    COALESCE(group_data.member_groups, ARRAY[]::text[]) as member_groups
FROM public.members m
LEFT JOIN public.branches b ON m.branch_id = b.id
LEFT JOIN (
    -- Subquery to aggregate tag information per member
    SELECT 
        mti.member_id,
        STRING_AGG(DISTINCT ti.name, ', ' ORDER BY ti.name) as all_tags,
        COUNT(DISTINCT ti.id) as tag_count,
        STRING_AGG(DISTINCT t.name || ': ' || ti.name, ' | ' ORDER BY t.name || ': ' || ti.name) as tags_with_categories,
        ARRAY_AGG(DISTINCT ti.name ORDER BY ti.name) as tags_array
    FROM public.member_tag_items mti
    INNER JOIN public.tag_items ti ON mti.tag_item_id = ti.id AND ti.is_active = true
    INNER JOIN public.tags t ON ti.tag_id = t.id AND t.is_active = true
    GROUP BY mti.member_id
) tag_data ON m.id = tag_data.member_id
LEFT JOIN (
    -- Subquery to aggregate member groups per member
    SELECT 
        mag.member_id,
        ARRAY_AGG(
            DISTINCT (
                g.name || COALESCE(' - ' || NULLIF(TRIM(mag.position), ''), '')
            )
            ORDER BY (
                g.name || COALESCE(' - ' || NULLIF(TRIM(mag.position), ''), '')
            )
        ) as member_groups
    FROM public.member_assigned_groups mag
    INNER JOIN public.groups g ON mag.group_id = g.id AND g.is_active = true
    GROUP BY mag.member_id
) group_data ON m.id = group_data.member_id
WHERE m.is_active = true;

-- Grant permissions on the updated view
GRANT SELECT ON public.members_summary TO authenticated;

-- Update RLS policy for the view
ALTER VIEW public.members_summary SET (security_invoker = true);

-- Add comment to document the enhanced view purpose
COMMENT ON VIEW public.members_summary IS 'Enhanced members summary view including branch information, address fields, comprehensive tag data with tags_array, and member_groups array for efficient filtering';

-- Helpful comments for new and existing fields
COMMENT ON COLUMN public.members_summary.assigned_tags IS 'Comma-separated list of all tag names assigned to the member';
COMMENT ON COLUMN public.members_summary.tag_count IS 'Total number of tags assigned to the member';
COMMENT ON COLUMN public.members_summary.tags_with_categories IS 'Tags organized by category in format "Category: Tag1, Tag2 | Category2: Tag3"';
COMMENT ON COLUMN public.members_summary.tags_array IS 'Array of tag names assigned to the member for efficient filtering and indexing';
COMMENT ON COLUMN public.members_summary.member_groups IS 'Array of strings representing assigned groups in format "Group Name - Position"';

-- Indexes on underlying tables already exist; retain for performance
-- CREATE INDEX IF NOT EXISTS idx_member_assigned_groups_member_id ON public.member_assigned_groups(member_id);