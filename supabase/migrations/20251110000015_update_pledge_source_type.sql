-- Update pledge_records to support source types similar to contributions

-- Allow pledges to be linked to member, group, tag_item, or other/church source
ALTER TABLE public.pledge_records
  ALTER COLUMN member_id DROP NOT NULL;

ALTER TABLE public.pledge_records
  ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('church','member','tag_item','group','other')) NOT NULL DEFAULT 'member';

ALTER TABLE public.pledge_records
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

ALTER TABLE public.pledge_records
  ADD COLUMN IF NOT EXISTS tag_item_id UUID REFERENCES public.tag_items(id) ON DELETE SET NULL;

-- Optional source name for 'other' type
ALTER TABLE public.pledge_records
  ADD COLUMN IF NOT EXISTS source TEXT;

-- Indexes for new relations and type
CREATE INDEX IF NOT EXISTS idx_pledge_records_source_type ON public.pledge_records(source_type);
CREATE INDEX IF NOT EXISTS idx_pledge_records_group ON public.pledge_records(group_id);
CREATE INDEX IF NOT EXISTS idx_pledge_records_tag_item ON public.pledge_records(tag_item_id);

-- Backfill: set source_type to 'member' where member_id is present (default handles most cases)
UPDATE public.pledge_records SET source_type = 'member' WHERE member_id IS NOT NULL;