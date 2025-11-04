import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ListPlus } from 'lucide-react';
import type { AttendanceOccasionWithRelations } from '@/types/attendance';

interface OccasionModeStepProps {
  occasions: AttendanceOccasionWithRelations[];
  occasionsLoading: boolean;
  selectedOccasionId: string;
  onChangeOccasionId: (id: string) => void;
  mode: 'single' | 'bulk';
  onChangeMode: (mode: 'single' | 'bulk') => void;
  isRecurring: boolean;
  hasSelection: boolean;
}

export function OccasionModeStep({
  occasions,
  occasionsLoading,
  selectedOccasionId,
  onChangeOccasionId,
  mode,
  onChangeMode,
  isRecurring,
  hasSelection,
}: OccasionModeStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ListPlus className="h-4 w-4" /> Occasion & Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Occasion *</Label>
            <Select value={selectedOccasionId} onValueChange={onChangeOccasionId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select occasion" />
              </SelectTrigger>
              <SelectContent>
                {occasionsLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading occasions...
                    </div>
                  </SelectItem>
                ) : occasions.length === 0 ? (
                  <SelectItem value="none" disabled>No occasions available</SelectItem>
                ) : (
                  occasions.map((occ) => (
                    <SelectItem key={occ.id} value={occ.id}>{occ.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Creation Mode</Label>
            <Select value={mode} onValueChange={(v) => onChangeMode(v as 'single' | 'bulk')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single session</SelectItem>
                <SelectItem value="bulk">Bulk sessions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasSelection && (
          <p className="text-sm text-muted-foreground">
            {isRecurring ? 'Recurring occasion detected.' : 'Non-recurring occasion.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}