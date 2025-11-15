-- Update assets assignment fields: separate member/group IDs and adjust type values
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS assigned_to_member_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_to_group_id UUID;

-- Migrate existing data from assigned_to_id/assigned_to_type if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assets' AND column_name='assigned_to_id'
  ) THEN
    -- Move 'user' -> member, 'group' -> group
    UPDATE public.assets
    SET assigned_to_member_id = CASE WHEN assigned_to_type = 'user' THEN assigned_to_id ELSE assigned_to_member_id END,
        assigned_to_group_id  = CASE WHEN assigned_to_type = 'group' THEN assigned_to_id ELSE assigned_to_group_id END;
  END IF;
END $$;

-- Adjust type constraint to only allow 'member' or 'group'
ALTER TABLE public.assets
  DROP CONSTRAINT IF EXISTS assets_assigned_to_type_check;

ALTER TABLE public.assets
  ADD CONSTRAINT assets_assigned_to_type_check
  CHECK (assigned_to_type IS NULL OR assigned_to_type IN ('member','group'));

-- Optionally drop legacy column if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='assets' AND column_name='assigned_to_id'
  ) THEN
    ALTER TABLE public.assets DROP COLUMN assigned_to_id;
  END IF;
END $$;

