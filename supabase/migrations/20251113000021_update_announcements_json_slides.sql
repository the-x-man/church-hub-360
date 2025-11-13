-- Migration to add slides column to announcements and drop announcement_slides table
-- This replaces the per-row slide storage with JSON-based storage

-- First, add the slides column to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS slides TEXT;

-- Update the column name from 'details' to 'description' for consistency
ALTER TABLE public.announcements 
RENAME COLUMN details TO description;

-- Create a function to migrate existing slides to JSON format
CREATE OR REPLACE FUNCTION migrate_announcement_slides_to_json()
RETURNS void AS $$
DECLARE
  announcement_record RECORD;
  slides_json TEXT;
BEGIN
  -- For each announcement, collect its slides as JSON array
  FOR announcement_record IN 
    SELECT id FROM public.announcements 
    WHERE is_deleted = false
  LOOP
    -- Build JSON array of slides for this announcement
    SELECT json_agg(
      json_build_object(
        'id', id,
        'position', position,
        'title', title,
        'content_html', body,
        'template_variant', template_variant,
        'bg_color', bg_color,
        'fg_color', fg_color,
        'font_size', font_size
      )
      ORDER BY position
    )
    INTO slides_json
    FROM public.announcement_slides
    WHERE announcement_id = announcement_record.id;
    
    -- Update the announcement with the JSON slides
    UPDATE public.announcements
    SET slides = slides_json
    WHERE id = announcement_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_announcement_slides_to_json();

-- Drop the migration function
DROP FUNCTION migrate_announcement_slides_to_json();

-- Now drop the announcement_slides table and all its dependencies
DROP TABLE IF EXISTS public.announcement_slides CASCADE;

-- Update RLS policies to include the new slides column
-- The existing policies should work fine since they're based on organization_id

-- Add a check constraint for the slides column to ensure valid JSON
ALTER TABLE public.announcements
ADD CONSTRAINT check_slides_valid_json 
CHECK (slides IS NULL OR json_valid(slides));