CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT,
  location TEXT,
  assigned_to_id UUID,
  assigned_to_type TEXT CHECK (assigned_to_type IS NULL OR assigned_to_type IN ('user','group')),
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  purchase_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_assets_org ON public.assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);

CREATE OR REPLACE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY assets_select_org
  ON public.assets FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND is_deleted = false
  );

CREATE POLICY assets_insert_org
  ON public.assets FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY assets_update_org
  ON public.assets FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY assets_delete_org
  ON public.assets FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;

