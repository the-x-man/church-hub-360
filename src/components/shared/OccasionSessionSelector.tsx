import React from 'react';
import { Label } from '@/components/ui/label';
import { OccasionSearchTypeahead } from '@/components/shared/OccasionSearchTypeahead';
import { SessionSearchTypeahead } from '@/components/shared/SessionSearchTypeahead';
import type { OccasionSearchResult } from '@/hooks/attendance/useAttendanceSearch';
import type { SessionSearchResult } from '@/hooks/attendance/useAttendanceSearch';

export interface OccasionSessionSelectorProps {
  occasionValue: OccasionSearchResult[];
  onOccasionChange: (items: OccasionSearchResult[]) => void;
  sessionValue: SessionSearchResult[];
  onSessionChange: (items: SessionSearchResult[]) => void;
  disabled?: boolean;
  className?: string;
}

export const OccasionSessionSelector: React.FC<OccasionSessionSelectorProps> = ({
  occasionValue,
  onOccasionChange,
  sessionValue,
  onSessionChange,
  disabled,
  className,
}) => {
  const selectedOccasionId = occasionValue?.[0]?.id;

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Occasion</Label>
          <OccasionSearchTypeahead
            value={occasionValue}
            onChange={(items) => {
              // single-select: if clearing occasion, also clear sessions
              onOccasionChange(items);
              if (items.length === 0 && sessionValue.length > 0) {
                onSessionChange([]);
              }
            }}
            multiSelect={false}
            disabled={disabled}
            placeholder="Search occasion"
          />
        </div>
        <div className="space-y-2">
          <Label>Session</Label>
          <SessionSearchTypeahead
            value={sessionValue}
            onChange={onSessionChange}
            multiSelect={false}
            disabled={disabled || !selectedOccasionId}
            occasionId={selectedOccasionId}
            placeholder={selectedOccasionId ? 'Search session' : 'Select occasion first'}
          />
        </div>
      </div>
    </div>
  );
};