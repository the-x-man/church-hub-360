import { Label } from '@/components/ui/label';
import MultipleSelector, { type Option } from '@/components/ui/multiselect';

export type DemographicKey = 'children' | 'young_adults' | 'adults';

interface DemographicsFilterProps {
  selected: DemographicKey[];
  onChange: (keys: DemographicKey[]) => void;
  className?: string;
}

const DEMO_OPTIONS: Option[] = [
  { value: 'children', label: 'Children (0–12)' },
  { value: 'young_adults', label: 'Young Adults (13–24)' },
  { value: 'adults', label: 'Adults (25+)' },
];

export function DemographicsFilter({ selected, onChange, className }: DemographicsFilterProps) {
  const selectedOptions = DEMO_OPTIONS.filter((o) => selected.includes(o.value as DemographicKey));

  return (
    <div className={className}>
      <Label>Demographics</Label>
      <MultipleSelector
        value={selectedOptions}
        options={DEMO_OPTIONS}
        placeholder="Select demographic groups"
        onChange={(opts) => onChange(opts.map((o) => o.value as DemographicKey))}
      />
      <div className="text-xs text-muted-foreground mt-1">Groups are age-based. If age is missing, member is excluded.</div>
    </div>
  );
}