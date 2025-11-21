-- Make members.email optional and refresh dependent summary view
-- This migration drops NOT NULL constraint on members.email (idempotent)
-- and recreates members_summary view to ensure compatibility.

-- Ensure email column allows NULL values
ALTER TABLE public.members
  ALTER COLUMN email DROP NOT NULL;

-- Recreate members_summary view (preserving existing enhancements)
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

    -- Member groups as text array in format 'Group Name - Position'
    COALESCE(group_data.member_groups, ARRAY[]::text[]) as member_groups
FROM public.members m
LEFT JOIN public.branches b ON m.branch_id = b.id
LEFT JOIN (
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

GRANT SELECT ON public.members_summary TO authenticated;
ALTER VIEW public.members_summary SET (security_invoker = true);
COMMENT ON VIEW public.members_summary IS 'Members summary view including branch info, address fields, tag data, tags_array, and member_groups';