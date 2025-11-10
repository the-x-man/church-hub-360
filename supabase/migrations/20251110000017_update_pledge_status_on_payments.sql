-- Update trigger function to also set pledge status based on totals and dates
-- Status rules:
-- - cancelled: preserved if already cancelled
-- - fulfilled: amount_remaining = 0
-- - overdue: end_date < today (UTC) and amount_remaining > 0
-- - active: otherwise

CREATE OR REPLACE FUNCTION public.sync_pledge_totals_from_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pledge UUID;
  old_pledge UUID;
  today_utc DATE := (timezone('utc', now()))::date;
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
        ), 0), 0),
        status = CASE
          WHEN pr.status = 'cancelled' THEN 'cancelled'
          WHEN GREATEST(pr.pledge_amount - COALESCE((
                 SELECT SUM(pp.amount)
                 FROM public.pledge_payments pp
                 WHERE pp.pledge_id = old_pledge AND pp.is_deleted = FALSE
               ), 0), 0) = 0 THEN 'fulfilled'
          WHEN pr.end_date < today_utc THEN 'overdue'
          ELSE 'active'
        END
    WHERE pr.id = old_pledge;
  END IF;

  -- Update the current pledge totals and status
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
        ), 0), 0),
        status = CASE
          WHEN pr.status = 'cancelled' THEN 'cancelled'
          WHEN GREATEST(pr.pledge_amount - COALESCE((
                 SELECT SUM(pp.amount)
                 FROM public.pledge_payments pp
                 WHERE pp.pledge_id = new_pledge AND pp.is_deleted = FALSE
               ), 0), 0) = 0 THEN 'fulfilled'
          WHEN pr.end_date < today_utc THEN 'overdue'
          ELSE 'active'
        END
    WHERE pr.id = new_pledge;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;