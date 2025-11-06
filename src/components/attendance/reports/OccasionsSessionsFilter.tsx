import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import MultipleSelector, { type Option } from '@/components/ui/multiselect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAttendanceOccasions } from '@/hooks/attendance/useAttendanceOccasions';
import { useAttendanceSessions } from '@/hooks/attendance/useAttendanceSessions';

export type OccasionSessionMode = 'all' | 'selected';

interface OccasionsSessionsFilterProps {
  mode: OccasionSessionMode;
  onModeChange: (mode: OccasionSessionMode) => void;
  selectedOccasionIds: string[];
  onOccasionsChange: (ids: string[]) => void;
  selectedSessionIds: string[];
  onSessionsChange: (ids: string[]) => void;
  className?: string;
}

export function OccasionsSessionsFilter({
  mode,
  onModeChange,
  selectedOccasionIds,
  onOccasionsChange,
  selectedSessionIds,
  onSessionsChange,
  className,
}: OccasionsSessionsFilterProps) {

  const { data: occasions = [], isLoading: occasionsLoading } = useAttendanceOccasions();
  const { data: sessions = [], isLoading: sessionsLoading } = useAttendanceSessions(
    selectedOccasionIds.length === 1 ? { occasion_id: selectedOccasionIds[0] } : undefined
  );

  const occasionOptions: Option[] = useMemo(() => {
    return occasions.map((o) => ({ value: o.id, label: o.name || 'Unnamed Occasion' }));
  }, [occasions]);

  const sessionOptions: Option[] = useMemo(() => {
    return sessions.map((s) => ({ value: s.id, label: (s as any).name || new Date(s.start_time).toLocaleString() }));
  }, [sessions]);

  const selectedOccasionOptions = useMemo<Option[]>(() => {
    return occasionOptions.filter((o) => selectedOccasionIds.includes(o.value));
  }, [occasionOptions, selectedOccasionIds]);

  const selectedSessionOptions = useMemo<Option[]>(() => {
    return sessionOptions.filter((s) => selectedSessionIds.includes(s.value));
  }, [sessionOptions, selectedSessionIds]);

  return (
    <div className={className}>
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="space-y-2 md:w-48">
          <Label>Scope</Label>
          <Select value={mode} onValueChange={(val) => onModeChange(val as OccasionSessionMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All occasions & sessions</SelectItem>
              <SelectItem value="selected">Selected occasions/sessions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === 'selected' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Occasions</Label>
              <MultipleSelector
                value={selectedOccasionOptions}
                options={occasionOptions}
                placeholder={occasionsLoading ? 'Loading occasions...' : 'Select occasions'}
                onChange={(opts: Option[]) => onOccasionsChange(opts.map((o: Option) => o.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Sessions</Label>
              <MultipleSelector
                value={selectedSessionOptions}
                options={sessionOptions}
                placeholder={sessionsLoading ? 'Loading sessions...' : 'Select sessions'}
                onChange={(opts: Option[]) => onSessionsChange(opts.map((o: Option) => o.value))}
              />
              <div className="text-xs text-muted-foreground">Selecting sessions narrows report strictly to those sessions.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}