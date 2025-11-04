import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/shared/DatePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { doesDateMatch, type BulkDurationOption } from '@/utils/recurrence';
import type { AttendanceOccasionWithRelations } from '@/types/attendance';

interface DateSelectionStepProps {
  mode: 'single' | 'bulk';
  isRecurring: boolean;
  selectedOccasion?: AttendanceOccasionWithRelations;
  singleDate: string;
  onChangeSingleDate: (value: string) => void;
  singleDateDisabled?: boolean;
  bulkOption: BulkDurationOption;
  onChangeBulkOption: (value: BulkDurationOption) => void;
  customStartDate: string;
  onChangeCustomStartDate: (value: string) => void;
  customEndDate: string;
  onChangeCustomEndDate: (value: string) => void;
  manualDateInput: string;
  onChangeManualDateInput: (value: string) => void;
  manualDates: string[];
  onChangeManualDates: (values: string[]) => void;
  validationErrors: string[];
  formatDateLabel?: (date: Date) => string;
}

export function DateSelectionStep({
  mode,
  isRecurring,
  selectedOccasion,
  singleDate,
  onChangeSingleDate,
  singleDateDisabled = false,
  bulkOption,
  onChangeBulkOption,
  customStartDate,
  onChangeCustomStartDate,
  customEndDate,
  onChangeCustomEndDate,
  manualDateInput,
  onChangeManualDateInput,
  manualDates,
  onChangeManualDates,
  validationErrors,
  formatDateLabel,
}: DateSelectionStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Date Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'single' ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <DatePicker
                label="Date *"
                value={singleDate}
                onChange={onChangeSingleDate}
                placeholder="Select session date"
                disabled={singleDateDisabled}
                formatDateLabel={formatDateLabel}
              />
              {singleDateDisabled && (
                <p className="text-xs text-muted-foreground px-1">Date is auto-set for recurring occasions.</p>
              )}
            </div>
            {isRecurring && selectedOccasion?.recurrence_rule && singleDate && !doesDateMatch(selectedOccasion.recurrence_rule, new Date(singleDate)) && (
              <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
                Selected date does not match the recurrence pattern.
              </div>
            )}
          </div>
        ) : (
          isRecurring ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Preset</Label>
                <Select value={bulkOption} onValueChange={(v) => onChangeBulkOption(v as BulkDurationOption)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next_1_session">Next session</SelectItem>
                    <SelectItem value="next_2_sessions">Next 2 sessions</SelectItem>
                    <SelectItem value="next_3_sessions">Next 3 sessions</SelectItem>
                    <SelectItem value="next_4_sessions">Next 4 sessions</SelectItem>
                    <SelectItem value="next_5_sessions">Next 5 sessions</SelectItem>
                    <SelectItem value="next_6_sessions">Next 6 sessions</SelectItem>
                    <SelectItem value="next_7_sessions">Next 7 sessions</SelectItem>
                    <SelectItem value="next_8_sessions">Next 8 sessions</SelectItem>
                    <SelectItem value="current_month">Current month</SelectItem>
                    <SelectItem value="next_2_months">Next 2 months</SelectItem>
                    <SelectItem value="next_3_months">Next 3 months</SelectItem>
                    <SelectItem value="next_4_months">Next 4 months</SelectItem>
                    <SelectItem value="next_5_months">Next 5 months</SelectItem>
                    <SelectItem value="next_6_months">Next 6 months</SelectItem>
                    <SelectItem value="custom_range">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {bulkOption === 'custom_range' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker label="Start date" value={customStartDate} onChange={onChangeCustomStartDate} formatDateLabel={formatDateLabel} />
                  <DatePicker label="End date" value={customEndDate} onChange={onChangeCustomEndDate} formatDateLabel={formatDateLabel} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DatePicker label="Pick date" value={manualDateInput} onChange={onChangeManualDateInput} formatDateLabel={formatDateLabel} />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!manualDateInput) return;
                      if (!manualDates.includes(manualDateInput)) {
                        onChangeManualDates([...manualDates, manualDateInput]);
                      }
                      onChangeManualDateInput('');
                    }}
                    disabled={!manualDateInput}
                  >
                    Add date
                  </Button>
                </div>
              </div>
              {manualDates.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected dates</Label>
                  <div className="space-y-2">
                    {manualDates.map((d) => (
                      <div key={d} className="flex items-center justify-between rounded-md border p-2 bg-muted/25">
                        <span className="text-sm">{formatDateLabel ? formatDateLabel(new Date(d)) : format(new Date(d), 'PPP')}</span>
                        <Button variant="outline" size="sm" onClick={() => onChangeManualDates(manualDates.filter((x) => x !== d))}>Remove</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {validationErrors.length > 0 && (
          <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
            {validationErrors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}