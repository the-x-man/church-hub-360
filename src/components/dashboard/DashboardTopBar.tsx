import { useOrganization } from '@/contexts/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BranchSelector } from '@/components/shared/BranchSelector';
import { useBranchScope, applyBranchScope } from '@/hooks/useBranchScope';

function daysUntilBirthday(dobIso: string) {
  const now = new Date();
  const dob = new Date(dobIso);
  const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  const diff = Math.ceil(
    (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

function nowIso() {
  return new Date().toISOString();
}

interface DashboardTopBarProps {
  branchId?: string | null;
  onBranchChange?: (id: string | undefined) => void;
}

export function DashboardTopBar({ branchId, onBranchChange }: DashboardTopBarProps) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const scope = useBranchScope(orgId);

  const { data: birthdays = [] } = useQuery({
    queryKey: ['dashboard-birthdays', orgId, branchId || 'all', scope.isScoped ? scope.branchIds : 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('members_summary')
        .select('id, full_name, date_of_birth')
        .eq('organization_id', orgId!)
        .not('date_of_birth', 'is', null);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      } else {
        const scoped = applyBranchScope(query, scope, 'branch_id');
        if (scoped.abortIfEmpty) return [];
        query = scoped.query;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  const upcoming = birthdays
    .filter((m: any) => m.date_of_birth)
    .map((m: any) => ({
      ...m,
      days: daysUntilBirthday(m.date_of_birth as string),
    }))
    .filter((m: any) => m.days <= 30)
    .sort((a: any, b: any) => a.days - b.days);

  const within3 = upcoming.filter((m: any) => m.days <= 3);
  const later = upcoming.filter((m: any) => m.days > 3);

  const { data: events = [] } = useQuery({
    queryKey: ['dashboard-events-upcoming', orgId, branchId || 'all', scope.isScoped ? scope.branchIds : 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('events_activities')
        .select('id, start_time, branch_id')
        .eq('organization_id', orgId!)
        .eq('is_deleted', false)
        .gte('start_time', nowIso());

      if (branchId) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
      } else {
        const scoped = applyBranchScope(query, scope, 'branch_id', true);
        if (scoped.abortIfEmpty) return [];
        query = scoped.query;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  return (
    <div className="flex w-full items-center justify-between bg-neutral-100 dark:bg-neutral-800/50 px-4 py-2 rounded-md border">
      <div className="flex gap-6">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex gap-2 items-center border border-dashed px-2 py-1 rounded-sm bg-background cursor-pointer">
              <span className="text-base">🎂</span>
              <span className="text-sm text-muted-foreground ">
                Upcoming Birthdays
              </span>
              <span className="text-sm font-semibold text-foreground">
                {upcoming.length}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="text-sm font-medium">Within 3 days</div>
              {within3.length === 0 ? (
                <div className="text-xs text-muted-foreground">None</div>
              ) : (
                <div className="space-y-1">
                  {within3.map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">
                        {m.full_name}
                      </span>
                      <span className="font-medium">{m.days} days</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-sm font-medium">Later this month</div>
              {later.length === 0 ? (
                <div className="text-xs text-muted-foreground">None</div>
              ) : (
                <div className="space-y-1 max-h-56 overflow-auto pr-1">
                  {later.map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">
                        {m.full_name}
                      </span>
                      <span className="font-medium">{m.days} days</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex gap-2 items-center border border-dashed px-2 py-1 rounded-sm bg-background">
          <span className="text-base">📅</span>
          <span className="text-sm text-muted-foreground">Upcoming Events</span>
          <span className="text-sm font-semibold text-foreground">
            {events.length}
          </span>
        </div>
      </div>
      <div className="flex items-center">
        <BranchSelector
          variant="single"
          value={branchId || undefined}
          onValueChange={(value) => onBranchChange?.(value as string | undefined)}
          allowClear
          placeholder="All branches"
        />
      </div>
    </div>
  );
}
