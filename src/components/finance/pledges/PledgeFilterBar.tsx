import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { DateFilter, PledgeFilter, PledgeStatus } from '@/types/finance';
import { DatePresetPicker, type DatePresetValue } from '@/components/attendance/reports/DatePresetPicker';
import { mapPickerToDateFilter, mapDateFilterToPicker, getPresetLabel } from '@/utils/finance/dateFilter';
import { Search, X, Filter, CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import React from 'react';
import { useDebounceValue } from '@/hooks/useDebounce';
import type { AmountComparison, AmountOperator } from '@/utils/finance/search';
import { BranchSelector } from '@/components/shared/BranchSelector';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useBranches } from '@/hooks/useBranchQueries';


type PledgeFilterVisibilityKey =
  | 'status'
  | 'amount_range'
  | 'amount_paid_range'
  | 'amount_remaining_range'
  | 'progress_range';

interface PledgeFilterBarProps {
  filters: PledgeFilter;
  onFiltersChange: (filters: PledgeFilter) => void;
  searchPlaceholder?: string;
  onSearchChange?: (search?: string) => void;
  amountSearch?: AmountComparison | null;
  onAmountSearchChange?: (cmp: AmountComparison | null) => void;
  showAddButton?: boolean;
  onAddClick?: () => void;
  addButtonLabel?: string;
  filterVisibility?: Partial<Record<PledgeFilterVisibilityKey, boolean>>;
}

export const PledgeFilterBar: React.FC<PledgeFilterBarProps> = ({
  filters,
  onFiltersChange,
  searchPlaceholder = 'Search pledges (type, campaign, description)...',
  onSearchChange,
  amountSearch,
  onAmountSearchChange,
  showAddButton = true,
  onAddClick,
  addButtonLabel = 'New Pledge',
  filterVisibility,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);
  const [showFilters, setShowFilters] = React.useState(false);
  const [pendingFilters, setPendingFilters] = React.useState<PledgeFilter>(filters);
  const { currentOrganization } = useOrganization();
  const { data: branches = [] } = useBranches(currentOrganization?.id);

  // Local amount search mode state
  const [searchMode, setSearchMode] = React.useState<'text' | 'amount'>('text');
  const [amountOperator, setAmountOperator] = React.useState<AmountOperator>('=');
  const [amountInput, setAmountInput] = React.useState<string>('');

  // Reflect external amount search in local UI state
  React.useEffect(() => {
    if (amountSearch) {
      setSearchMode('amount');
      setAmountOperator(amountSearch.operator as AmountOperator);
      setAmountInput(String(amountSearch.value ?? ''));
    }
  }, [amountSearch]);

  React.useEffect(() => {
    if (showFilters) setPendingFilters(filters);
  }, [showFilters, filters]);

  // Propagate debounced search term to parent when in text mode
  React.useEffect(() => {
    const next = debouncedSearchTerm?.trim();
    if (!onSearchChange) return;
    if (searchMode === 'text') {
      onSearchChange(next ? next : undefined);
    }
  }, [debouncedSearchTerm, onSearchChange, searchMode]);

  React.useEffect(() => {
    if (searchMode === 'amount') {
      setSearchTerm('');
      onSearchChange?.(undefined);
    } else {
      setAmountInput('');
      setAmountOperator('=');
      onAmountSearchChange?.(null);
    }
  }, [searchMode]);

  const isVisible = React.useCallback(
    (key: PledgeFilterVisibilityKey) => filterVisibility?.[key] !== false,
    [filterVisibility]
  );

  const [datePresetValue, setDatePresetValue] = React.useState<DatePresetValue>(mapDateFilterToPicker(filters.date_filter));
  React.useEffect(() => {
    setDatePresetValue(mapDateFilterToPicker(filters.date_filter));
  }, [filters.date_filter]);

  const formatDateRange = () => {
    const from = datePresetValue?.range?.from;
    const to = datePresetValue?.range?.to;
    if (from && to) {
      return `${format(from, 'MMM dd')} - ${format(to, 'MMM dd')}`;
    }
    return 'Select dates';
  };

  const clearAllFilters = () => {
    setPendingFilters({
      ...filters,
      status_filter: undefined,
      amount_range: undefined,
      amount_paid_range: undefined,
      amount_remaining_range: undefined,
      progress_range: undefined,
      branch_id_filter: undefined,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status_filter?.length) count++;
    if (filters.amount_range?.min !== undefined || filters.amount_range?.max !== undefined) count++;
    if (filters.amount_paid_range?.min !== undefined || filters.amount_paid_range?.max !== undefined) count++;
    if (filters.amount_remaining_range?.min !== undefined || filters.amount_remaining_range?.max !== undefined) count++;
    if (filters.progress_range?.min !== undefined || filters.progress_range?.max !== undefined) count++;
    if (filters.branch_id_filter?.length) count++;
    return count;
  };

  const dateBadgeLabel = React.useMemo(() => {
    const df = filters.date_filter;
    if (df.type === 'preset' && df.preset) {
      return `Date: ${getPresetLabel(df.preset)}`;
    }
    if (df.type === 'custom' && df.start_date && df.end_date) {
      const from = format(new Date(df.start_date), 'MMM dd, yyyy');
      const to = format(new Date(df.end_date), 'MMM dd, yyyy');
      return `Date: ${from} - ${to}`;
    }
    return undefined;
  }, [filters.date_filter]);

  const statusOptions: { value: PledgeStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'fulfilled', label: 'Fulfilled' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'overdue', label: 'Overdue' },
  ];

  return (
    <div className="space-y-4">
      {/* Top row with search, date filter, filters toggle and add button (consistent with FinanceFilterBar) */}
      <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center">
          {/* Search mode toggle */}
          <div className="flex items-center gap-2">
            <Label htmlFor="amount-mode" className="text-xs">Amount</Label>
            <Switch id="amount-mode" checked={searchMode === 'amount'} onCheckedChange={(checked) => setSearchMode(checked ? 'amount' : 'text')} />
          </div>

          {/* Operator select when amount mode */}
          {searchMode === 'amount' && (
            <div className="min-w-[110px]">
              <Select value={amountOperator} onValueChange={(v) => setAmountOperator(v as AmountOperator)}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder=">" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=">">&gt;</SelectItem>
                  <SelectItem value=">=">&gt;=</SelectItem>
                  <SelectItem value="=">=</SelectItem>
                  <SelectItem value="<">{'<'}</SelectItem>
                  <SelectItem value="<=">{'<='}</SelectItem>
                  <SelectItem value="!=">!=</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Unified input: displays either text or amount with operator */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={searchMode === 'amount' ? 'Enter pledge amount' : searchPlaceholder}
              value={searchMode === 'amount' ? `${amountOperator} ${amountInput}` : searchTerm}
              onChange={(e) => {
                if (searchMode === 'amount') {
                  const raw = e.target.value;
                  const cleaned = raw.replace(/^\s*([<>]=?|!?=)?\s*/, '');
                  const numericPart = cleaned.replace(/[^0-9.,]/g, '');
                  setAmountInput(numericPart);
                } else {
                  setSearchTerm(e.target.value);
                  onSearchChange?.(e.target.value.trim() ? e.target.value.trim() : undefined);
                }
              }}
              className="pl-9"
            />
          </div>

          {/* Apply button when in amount mode */}
          {searchMode === 'amount' && (
            <Button
              variant="outline"
              onClick={() => {
                const numStr = amountInput.replace(/,/g, '');
                const num = Number(numStr);
                if (!Number.isNaN(num)) {
                  onAmountSearchChange?.({ operator: amountOperator, value: num });
                } else {
                  onAmountSearchChange?.(null);
                }
              }}
              disabled={!amountInput.trim()}
            >
              Apply
            </Button>
          )}

          {/* Date Filter using DatePresetPicker (consistent with FinanceFilterBar) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3">
                <DatePresetPicker
                  value={datePresetValue}
                  onChange={(val) => {
                    setDatePresetValue(val);
                    const df = mapPickerToDateFilter(val);
                    onFiltersChange({ ...filters, date_filter: df });
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Filters toggle (consistent with FinanceFilterBar) */}
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </div>

        {/* Action buttons (right-aligned) */}
        <div className="flex gap-2">
          {showAddButton && onAddClick && (
            <Button onClick={onAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              {addButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Active filter badges */}
      {(
        (filters.status_filter && filters.status_filter.length) ||
        (filters.amount_range && (filters.amount_range.min !== undefined || filters.amount_range.max !== undefined)) ||
        (filters.amount_paid_range && (filters.amount_paid_range.min !== undefined || filters.amount_paid_range.max !== undefined)) ||
        (filters.amount_remaining_range && (filters.amount_remaining_range.min !== undefined || filters.amount_remaining_range.max !== undefined)) ||
        (filters.progress_range && (filters.progress_range.min !== undefined || filters.progress_range.max !== undefined)) ||
        (filters.branch_id_filter && filters.branch_id_filter.length) ||
        dateBadgeLabel
      ) && (
        <div className="flex flex-wrap gap-2">
          {dateBadgeLabel && (
            <Badge variant="secondary" className="gap-1">
              {dateBadgeLabel}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => {
                  const newDf: DateFilter = { type: 'preset', preset: 'this_month' };
                  onFiltersChange({ ...filters, date_filter: newDf });
                  setDatePresetValue(mapDateFilterToPicker(newDf));
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Status badges */}
          {filters.status_filter && filters.status_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = filters.status_filter!.map((s) => statusOptions.find((o) => o.value === s)?.label || s);
                return labels.length <= 2 ? `Status: ${labels.join(', ')}` : `Status: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, status_filter: undefined })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Amount range badges */}
          {filters.amount_range && (filters.amount_range.min !== undefined || filters.amount_range.max !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const min = filters.amount_range?.min;
                const max = filters.amount_range?.max;
                if (min !== undefined && max !== undefined) return `Pledge: GHS${min} - GHS${max}`;
                if (min !== undefined) return `Pledge: ≥ GHS${min}`;
                if (max !== undefined) return `Pledge: ≤ GHS${max}`;
                return 'Pledge: Any';
              })()}
              <Button variant="ghost" size="sm" className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" onClick={() => onFiltersChange({ ...filters, amount_range: undefined })}>
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.amount_paid_range && (filters.amount_paid_range.min !== undefined || filters.amount_paid_range.max !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const min = filters.amount_paid_range?.min;
                const max = filters.amount_paid_range?.max;
                if (min !== undefined && max !== undefined) return `Paid: GHS${min} - GHS${max}`;
                if (min !== undefined) return `Paid: ≥ GHS${min}`;
                if (max !== undefined) return `Paid: ≤ GHS${max}`;
                return 'Paid: Any';
              })()}
              <Button variant="ghost" size="sm" className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" onClick={() => onFiltersChange({ ...filters, amount_paid_range: undefined })}>
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.amount_remaining_range && (filters.amount_remaining_range.min !== undefined || filters.amount_remaining_range.max !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const min = filters.amount_remaining_range?.min;
                const max = filters.amount_remaining_range?.max;
                if (min !== undefined && max !== undefined) return `Remaining: GHS${min} - GHS${max}`;
                if (min !== undefined) return `Remaining: ≥ GHS${min}`;
                if (max !== undefined) return `Remaining: ≤ GHS${max}`;
                return 'Remaining: Any';
              })()}
              <Button variant="ghost" size="sm" className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" onClick={() => onFiltersChange({ ...filters, amount_remaining_range: undefined })}>
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.progress_range && (filters.progress_range.min !== undefined || filters.progress_range.max !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const min = filters.progress_range?.min;
                const max = filters.progress_range?.max;
                if (min !== undefined && max !== undefined) return `Progress: ${min}% - ${max}%`;
                if (min !== undefined) return `Progress: ≥ ${min}%`;
                if (max !== undefined) return `Progress: ≤ ${max}%`;
                return 'Progress: Any';
              })()}
              <Button variant="ghost" size="sm" className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" onClick={() => onFiltersChange({ ...filters, progress_range: undefined })}>
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Branch */}
          {filters.branch_id_filter && filters.branch_id_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const ids = filters.branch_id_filter!;
                const labels = ids
                  .map((id) => branches.find((b: any) => b.id === id)?.name)
                  .filter((n): n is string => !!n);
                return labels.length <= 2
                  ? `Branch: ${labels.join(', ')}`
                  : `Branch: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, branch_id_filter: undefined })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Advanced Filters</h3>
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Filter */}
          {isVisible('status') && (
            <div>
              <Label>Status</Label>
              <Select
                value={pendingFilters.status_filter?.[0] || 'all'}
                onValueChange={(value) => {
                  setPendingFilters({
                    ...pendingFilters,
                    status_filter: value === 'all' ? undefined : [value as PledgeStatus],
                  });
                }}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Pledge Amount Range */}
          {isVisible('amount_range') && (
            <div>
              <Label>Pledge Amount</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={pendingFilters.amount_range?.min ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setPendingFilters({
                      ...pendingFilters,
                      amount_range: { ...(pendingFilters.amount_range || {}), min: value },
                    });
                  }}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={pendingFilters.amount_range?.max ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setPendingFilters({
                      ...pendingFilters,
                      amount_range: { ...(pendingFilters.amount_range || {}), max: value },
                    });
                  }}
                />
              </div>
            </div>
          )}

            {/* Amount Paid Range */}
            {isVisible('amount_paid_range') && (
              <div>
                <Label>Amount Paid</Label>
                <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={pendingFilters.amount_paid_range?.min ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setPendingFilters({
                      ...pendingFilters,
                      amount_paid_range: { ...(pendingFilters.amount_paid_range || {}), min: value },
                    });
                  }}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={pendingFilters.amount_paid_range?.max ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setPendingFilters({
                      ...pendingFilters,
                      amount_paid_range: { ...(pendingFilters.amount_paid_range || {}), max: value },
                    });
                  }}
                />
              </div>
              </div>
            )}

            {/* Branch Filter */}
            <div>
              <Label>Branch</Label>
              <BranchSelector
                variant="single"
                value={pendingFilters.branch_id_filter?.[0]}
                onValueChange={(value) => {
                  setPendingFilters({
                    ...pendingFilters,
                    branch_id_filter: value ? [value as string] : undefined,
                  });
                }}
                allowClear
                placeholder="All branches"
              />
            </div>

          {/* Amount Remaining Range */}
          {isVisible('amount_remaining_range') && (
            <div>
              <Label>Amount Remaining</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={pendingFilters.amount_remaining_range?.min ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setPendingFilters({
                      ...pendingFilters,
                      amount_remaining_range: { ...(pendingFilters.amount_remaining_range || {}), min: value },
                    });
                  }}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={pendingFilters.amount_remaining_range?.max ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setPendingFilters({
                      ...pendingFilters,
                      amount_remaining_range: { ...(pendingFilters.amount_remaining_range || {}), max: value },
                    });
                  }}
                />
              </div>
            </div>
          )}

          {/* Progress Range (percentage) */}
          {isVisible('progress_range') && (
            <div>
              <Label>Progress (%)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Min %"
                  value={pendingFilters.progress_range?.min ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? Math.min(100, Math.max(0, parseFloat(e.target.value))) : undefined;
                    setPendingFilters({
                      ...pendingFilters,
                      progress_range: { ...(pendingFilters.progress_range || {}), min: value },
                    });
                  }}
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Max %"
                  value={pendingFilters.progress_range?.max ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? Math.min(100, Math.max(0, parseFloat(e.target.value))) : undefined;
                    setPendingFilters({
                      ...pendingFilters,
                      progress_range: { ...(pendingFilters.progress_range || {}), max: value },
                    });
                  }}
                />
              </div>
            </div>
          )}

          </div>

          {/* Panel actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowFilters(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                onFiltersChange(pendingFilters);
                setShowFilters(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};