-- PostgreSQL Trigger Function to Clean Up Member Tag Assignments
-- This function automatically removes member tag assignments when a tag is soft deleted (is_active = false)

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.cleanup_tag_assignments()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if is_active changed from true to false (soft delete)
    IF OLD.is_active = true AND NEW.is_active = false THEN
        
        -- Step 1: Soft delete all tag_items belonging to this tag
        UPDATE public.tag_items 
        SET is_active = false, 
            updated_at = NOW()
        WHERE tag_id = NEW.id 
        AND is_active = true;
        
        -- Step 2: Remove all member_tag_items assignments for tag_items of this tag
        -- We use a subquery to find all tag_item_ids that belong to this tag
        DELETE FROM public.member_tag_items 
        WHERE tag_item_id IN (
            SELECT id 
            FROM public.tag_items 
            WHERE tag_id = NEW.id
        );
        
        -- Log the cleanup action (optional - can be removed if not needed)
        RAISE NOTICE 'Cleaned up tag assignments for tag: % (ID: %)', NEW.name, NEW.id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that calls the function when tags.is_active is updated
DROP TRIGGER IF EXISTS trigger_cleanup_tag_assignments ON public.tags;

CREATE TRIGGER trigger_cleanup_tag_assignments
    AFTER UPDATE OF is_active ON public.tags
    FOR EACH ROW
    WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
    EXECUTE FUNCTION public.cleanup_tag_assignments();

-- Add helpful comments
COMMENT ON FUNCTION public.cleanup_tag_assignments() IS 
'Automatically cleans up member tag assignments when a tag is soft deleted (is_active = false). 
This function:
1. Soft deletes all tag_items belonging to the deleted tag
2. Removes all member_tag_items assignments for those tag_items
This ensures data consistency and prevents orphaned assignments.';

COMMENT ON TRIGGER trigger_cleanup_tag_assignments ON public.tags IS 
'Triggers cleanup_tag_assignments() function when tags.is_active is updated to maintain referential integrity.';