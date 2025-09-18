-- Migration to add created_by columns to user_organizations and user_branches tables
-- This tracks who created the user and who assigned branches

-- Step 1: Add created_by column to user_organizations table
ALTER TABLE public.user_organizations 
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add foreign key constraint with SET NULL on delete (cascade set to null)
ALTER TABLE public.user_organizations 
ADD CONSTRAINT user_organizations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_created_by 
ON public.user_organizations USING btree (created_by) TABLESPACE pg_default;

-- Step 2: Add created_by column to user_branches table
ALTER TABLE public.user_branches 
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add foreign key constraint with SET NULL on delete (cascade set to null)
ALTER TABLE public.user_branches 
ADD CONSTRAINT user_branches_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_branches_created_by 
ON public.user_branches USING btree (created_by) TABLESPACE pg_default;

-- Note: The created_by columns are nullable to handle existing records
-- and cases where the creator might be deleted from the system
-- New records should populate this field when users are created or assigned to branches