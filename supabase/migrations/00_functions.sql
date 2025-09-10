-- Common database functions for triggers

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set published_at when status changes to 'published'
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set published_at when status changes to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.published_at = timezone('utc'::text, now());
  END IF;
  
  -- Clear published_at when status changes away from 'published'
  IF NEW.status != 'published' AND OLD.status = 'published' THEN
    NEW.published_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;