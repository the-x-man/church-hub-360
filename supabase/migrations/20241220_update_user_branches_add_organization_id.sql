-- Migration to add organization_id to existing user_branches table
-- This handles existing data safely

-- Step 1: Add organization_id column as nullable first
ALTER TABLE public.user_branches 
ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Step 2: Update existing records to set organization_id based on branch's organization
UPDATE public.user_branches 
SET organization_id = branches.organization_id
FROM public.branches
WHERE user_branches.branch_id = branches.id
AND user_branches.organization_id IS NULL;

-- Step 3: Make organization_id NOT NULL after data is populated
ALTER TABLE public.user_branches 
ALTER COLUMN organization_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE public.user_branches 
ADD CONSTRAINT user_branches_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE;

-- Step 5: Drop old unique constraint and add new one with organization_id
ALTER TABLE public.user_branches 
DROP CONSTRAINT IF EXISTS user_branches_user_branch_unique;

ALTER TABLE public.user_branches 
ADD CONSTRAINT user_branches_user_branch_org_unique 
UNIQUE (user_id, branch_id, organization_id);

-- Step 6: Add index for organization_id
CREATE INDEX IF NOT EXISTS idx_user_branches_organization_id 
ON public.user_branches USING btree (organization_id) TABLESPACE pg_default;

-- Step 7: Update RLS policies if needed (they should already exist from the original migration)
-- The existing RLS policies should continue to work with the new column