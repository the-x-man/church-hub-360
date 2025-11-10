-- Create finance tables: income, expenses, pledge_records, pledge_payments
-- Includes foreign keys, indexes, RLS with org scoping, and updated_at triggers

-- Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Income table
CREATE TABLE IF NOT EXISTS public.income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  notes TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  -- Income categorization flags
  income_type TEXT CHECK (income_type IN (
    'general_income','contribution','donation','pledge_payment'
  )) NOT NULL DEFAULT 'general_income',

  -- Occasion details (optional)
  category TEXT,
  occasion_name TEXT,
  attendance_occasion_id UUID REFERENCES public.attendance_occasions(id) ON DELETE SET NULL,
  attendance_session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,

  -- Source type and relations
  source_type TEXT CHECK (source_type IN ('church','member','tag_item','group','other')) NOT NULL DEFAULT 'church',
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  tag_item_id UUID REFERENCES public.tag_items(id) ON DELETE SET NULL,

  -- Payment metadata
  payment_method TEXT CHECK (payment_method IN (
    'cash','check','credit_card','debit_card','bank_transfer','mobile_payment','online','other'
  )) NOT NULL,
  receipt_number TEXT,

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Unique receipt within organization (optional, allows nulls)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_income_receipt_per_org
ON public.income(organization_id, receipt_number)
WHERE receipt_number IS NOT NULL;

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_income_org ON public.income(organization_id);
CREATE INDEX IF NOT EXISTS idx_income_branch ON public.income(branch_id);
CREATE INDEX IF NOT EXISTS idx_income_member ON public.income(member_id);
CREATE INDEX IF NOT EXISTS idx_income_type ON public.income(income_type);
CREATE INDEX IF NOT EXISTS idx_income_date ON public.income(date);
CREATE INDEX IF NOT EXISTS idx_income_source_type ON public.income(source_type);

-- Update trigger
CREATE OR REPLACE TRIGGER update_income_updated_at
BEFORE UPDATE ON public.income
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  notes TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  category TEXT CHECK (category IN (
    'utilities','maintenance','supplies','equipment','salaries','benefits','ministry_expenses','outreach','missions','events','transportation','insurance','professional_services','other'
  )) NOT NULL,
  vendor TEXT,
  receipt_number TEXT,
  payment_method TEXT CHECK (payment_method IN (
    'cash','check','credit_card','debit_card','bank_transfer','mobile_payment','online','other'
  )) NOT NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_date TIMESTAMPTZ,

  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_expense_receipt_per_org
ON public.expenses(organization_id, receipt_number)
WHERE receipt_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_org ON public.expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON public.expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

CREATE OR REPLACE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Pledge records
CREATE TABLE IF NOT EXISTS public.pledge_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  pledge_amount NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_remaining NUMERIC(12,2) NOT NULL DEFAULT 0,
  pledge_type TEXT CHECK (pledge_type IN (
    'building_fund','missions','special_project','annual_pledge','capital_campaign','other'
  )) NOT NULL,
  campaign_name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_frequency TEXT CHECK (payment_frequency IN (
    'weekly','bi_weekly','monthly','quarterly','annually','one_time'
  )) NOT NULL,
  status TEXT CHECK (status IN ('active','fulfilled','cancelled','overdue')) NOT NULL DEFAULT 'active',
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_pledge_records_org ON public.pledge_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_pledge_records_member ON public.pledge_records(member_id);
CREATE INDEX IF NOT EXISTS idx_pledge_records_status ON public.pledge_records(status);

CREATE OR REPLACE TRIGGER update_pledge_records_updated_at
BEFORE UPDATE ON public.pledge_records
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Pledge payments
CREATE TABLE IF NOT EXISTS public.pledge_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id UUID NOT NULL REFERENCES public.pledge_records(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method TEXT CHECK (payment_method IN (
    'cash','check','credit_card','debit_card','bank_transfer','mobile_payment','online','other'
  )) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_pledge_payments_pledge ON public.pledge_payments(pledge_id);
CREATE INDEX IF NOT EXISTS idx_pledge_payments_date ON public.pledge_payments(payment_date);

-- RLS enable
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_payments ENABLE ROW LEVEL SECURITY;

-- Policies: organization-scoped, created_by-restricted modifications
-- Income policies
CREATE POLICY income_select_org
  ON public.income FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND is_deleted = false
  );

CREATE POLICY income_insert_org
  ON public.income FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

CREATE POLICY income_update_creator
  ON public.income FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

CREATE POLICY income_soft_delete_creator
  ON public.income FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

-- Expenses policies
CREATE POLICY expenses_select_org
  ON public.expenses FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND is_deleted = false
  );

CREATE POLICY expenses_insert_org
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

CREATE POLICY expenses_update_creator
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

CREATE POLICY expenses_soft_delete_creator
  ON public.expenses FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

-- Pledge records policies
CREATE POLICY pledge_records_select_org
  ON public.pledge_records FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND is_deleted = false
  );

CREATE POLICY pledge_records_insert_org
  ON public.pledge_records FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

CREATE POLICY pledge_records_update_creator
  ON public.pledge_records FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

CREATE POLICY pledge_records_soft_delete_creator
  ON public.pledge_records FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations
      WHERE user_id = auth.uid() AND is_active = true
    ) AND created_by = auth.uid()
  );

-- Pledge payments policies (scope via pledge -> organization)
CREATE POLICY pledge_payments_select_org
  ON public.pledge_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pledge_records pr
      WHERE pr.id = pledge_id AND pr.organization_id IN (
        SELECT organization_id FROM public.user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY pledge_payments_insert_org
  ON public.pledge_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pledge_records pr
      WHERE pr.id = pledge_id AND pr.organization_id IN (
        SELECT organization_id FROM public.user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      )
    ) AND created_by = auth.uid()
  );

CREATE POLICY pledge_payments_update_creator
  ON public.pledge_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pledge_records pr
      WHERE pr.id = pledge_id AND pr.organization_id IN (
        SELECT organization_id FROM public.user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      )
    ) AND created_by = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pledge_records pr
      WHERE pr.id = pledge_id AND pr.organization_id IN (
        SELECT organization_id FROM public.user_organizations
        WHERE user_id = auth.uid() AND is_active = true
      )
    ) AND created_by = auth.uid()
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pledge_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pledge_payments TO authenticated;