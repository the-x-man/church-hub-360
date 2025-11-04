import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/shared/DateTimePicker';
import { ListPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DraftSession } from '@/types/attendanceWizard';

interface GeneratedSessionsListProps {
  drafts: DraftSession[];
  onUpdateDraft: (id: string, updates: Partial<DraftSession>) => void;
  onRemoveDraft: (id: string) => void;
  datesReadOnly?: boolean;
  formatDateLabel?: (date: Date) => string;
}

export function GeneratedSessionsList({
  drafts,
  onUpdateDraft,
  onRemoveDraft,
  datesReadOnly = false,
  formatDateLabel,
}: GeneratedSessionsListProps) {
  if (drafts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListPlus className="h-4 w-4" /> Generated Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {drafts.map((d) => (
            <div key={d.id} className={cn('p-3 border rounded-md')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Name</Label>
                  <Input
                    value={d.name || ''}
                    onChange={(e) =>
                      onUpdateDraft(d.id, { name: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveDraft(d.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <DateTimePicker
                  dateLabel="Start"
                  timeLabel="Start Time"
                  value={d.start_time}
                  onChange={(v) => onUpdateDraft(d.id, { start_time: v })}
                  disableDate={datesReadOnly}
                  formatDateLabel={formatDateLabel}
                />
                <DateTimePicker
                  dateLabel="End"
                  timeLabel="End Time"
                  value={d.end_time}
                  onChange={(v) => onUpdateDraft(d.id, { end_time: v })}
                  disableDate={datesReadOnly}
                  formatDateLabel={formatDateLabel}
                />
              </div>
              {datesReadOnly && (
                <p className="text-xs text-muted-foreground mt-2">
                  Dates are read-only for recurring occasions.
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
