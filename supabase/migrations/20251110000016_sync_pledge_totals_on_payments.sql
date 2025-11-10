-- Sync pledge totals when payments change
-- Adds trigger function to update amount_paid and amount_remaining on pledge_records
-- Also aligns pledge_payments schema with app expectations (is_deleted, organization_id)

-- Ensure helper columns exist on pledge_payments
ALTER TABLE public.pledge_payments
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.pledge_payments
  ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Backfill organization_id from pledge_records for existing rows
UPDATE public.pledge_payments pp
SET organization_id = pr.organization_id
FROM public.pledge_records pr
WHERE pp.pledge_id = pr.id AND pp.organization_id IS NULL;

-- Add FK and index for organization_id if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_pledge_payments_org'
  ) THEN
    ALTER TABLE public.pledge_payments
      ADD CONSTRAINT fk_pledge_payments_org
      FOREIGN KEY (organization_id)
      REFERENCES public.organizations(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pledge_payments_org ON public.pledge_payments(organization_id);

-- Set NOT NULL after backfill
ALTER TABLE public.pledge_payments ALTER COLUMN organization_id SET NOT NULL;

-- Trigger function to sync pledge totals from payments
CREATE OR REPLACE FUNCTION public.sync_pledge_totals_from_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pledge UUID;
  old_pledge UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_pledge := NEW.pledge_id;
  ELSIF TG_OP = 'UPDATE' THEN
    new_pledge := NEW.pledge_id;
    old_pledge := OLD.pledge_id;
  ELSIF TG_OP = 'DELETE' THEN
    new_pledge := OLD.pledge_id;
  END IF;

  -- If the payment was moved to another pledge, update the old one too
  IF old_pledge IS NOT NULL AND old_pledge <> new_pledge THEN
    UPDATE public.pledge_records pr
    SET amount_paid = COALESCE((
          SELECT SUM(pp.amount)
          FROM public.pledge_payments pp
          WHERE pp.pledge_id = old_pledge AND pp.is_deleted = FALSE
        ), 0),
        amount_remaining = GREATEST(pr.pledge_amount - COALESCE((
          SELECT SUM(pp.amount)
          FROM public.pledge_payments pp
          WHERE pp.pledge_id = old_pledge AND pp.is_deleted = FALSE
        ), 0), 0)
    WHERE pr.id = old_pledge;
  END IF;

  -- Update the current pledge totals
  IF new_pledge IS NOT NULL THEN
    UPDATE public.pledge_records pr
    SET amount_paid = COALESCE((
          SELECT SUM(pp.amount)
          FROM public.pledge_payments pp
          WHERE pp.pledge_id = new_pledge AND pp.is_deleted = FALSE
        ), 0),
        amount_remaining = GREATEST(pr.pledge_amount - COALESCE((
          SELECT SUM(pp.amount)
          FROM public.pledge_payments pp
          WHERE pp.pledge_id = new_pledge AND pp.is_deleted = FALSE
        ), 0), 0)
    WHERE pr.id = new_pledge;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for insert, update, delete on pledge_payments
DROP TRIGGER IF EXISTS sync_pledge_totals_after_insert ON public.pledge_payments;
DROP TRIGGER IF EXISTS sync_pledge_totals_after_update ON public.pledge_payments;
DROP TRIGGER IF EXISTS sync_pledge_totals_after_delete ON public.pledge_payments;

CREATE TRIGGER sync_pledge_totals_after_insert
AFTER INSERT ON public.pledge_payments
FOR EACH ROW EXECUTE FUNCTION public.sync_pledge_totals_from_payments();

CREATE TRIGGER sync_pledge_totals_after_update
AFTER UPDATE ON public.pledge_payments
FOR EACH ROW EXECUTE FUNCTION public.sync_pledge_totals_from_payments();

CREATE TRIGGER sync_pledge_totals_after_delete
AFTER DELETE ON public.pledge_payments
FOR EACH ROW EXECUTE FUNCTION public.sync_pledge_totals_from_payments();