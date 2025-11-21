import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DateFilter, PaymentFilter } from '@/types/finance';
import { DatePresetPicker, type DatePresetValue } from '@/components/attendance/reports/DatePresetPicker';
import { mapPickerToDateFilter, mapDateFilterToPicker, getPresetLabel } from '@/utils/finance/dateFilter';
import { Search, X, Filter, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import React from 'react';
import { useDebounceValue } from '@/hooks/useDebounce';
import { paymentMethodOptions as paymentMethodOptionsConst } from '@/components/finance/constants';
import type { AmountComparison, AmountOperator } from '@/utils/finance/search';
import { Switch } from '@/components/ui/switch';
import { BranchSelector } from '@/components/shared/BranchSelector';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useBranches } from '@/hooks/useBranchQueries';

interface PaymentsFilterBarProps {
  filters: PaymentFilter;
  onFiltersChange: (filters: PaymentFilter) => void;
  searchPlaceholder?: string;
  onSearchChange?: (search?: string) => void;
  amountSearch?: AmountComparison | null;
  onAmountSearchChange?: (cmp: AmountComparison | null) => void;
}

export const PaymentsFilterBar: React.FC<PaymentsFilterBarProps> = ({
  filters,
  onFiltersChange,
  searchPlaceholder = 'Search payments (notes)...',
  onSearchChange,
  amountSearch,
  onAmountSearchChange,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);
  const [showFilters, setShowFilters] = React.useState(false);
  const [pendingFilters, setPendingFilters] = React.useState<PaymentFilter>(filters);
  const { currentOrganization } = useOrganization();
  const { data: branches = [] } = useBranches(currentOrganization?.id);

  // Amount search mode
  const [searchMode, setSearchMode] = React.useState<'text' | 'amount'>('text');
  const [amountOperator, setAmountOperator] = React.useState<AmountOperator>('=');
  const [amountInput, setAmountInput] = React.useState<string>('');

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
      payment_method_filter: undefined,
      amount_range: undefined,
      branch_id_filter: undefined,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.payment_method_filter?.length) count++;
    if (filters.amount_range?.min !== undefined || filters.amount_range?.max !== undefined) count++;
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

  const paymentMethodLabel = (pm: string) => {
    return paymentMethodOptionsConst.find((p) => p.value === pm)?.label || pm;
  };

  return (
    <div className="space-y-4">
      {/* Top row with search, date filter, and filters toggle */}
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
              placeholder={searchMode === 'amount' ? 'Enter amount (e.g., 100 or 1,000.50)' : searchPlaceholder}
              value={searchMode === 'amount' ? `${amountOperator} ${amountInput}` : searchTerm}
              onChange={(e) => {
                if (searchMode === 'amount') {
                  const raw = e.target.value;
                  const cleaned = raw.replace(/^\s*([<>]=?|!?=)?\s*/, '');
                  const numericPart = cleaned.replace(/[^0-9.,]/g, '');
                  setAmountInput(numericPart);
                } else {
                  setSearchTerm(e.target.value);
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

          {/* Date Filter */}
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

          {/* Filters toggle */}
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">{getActiveFilterCount()}</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Active filter badges */}
      {((filters.payment_method_filter && filters.payment_method_filter.length) ||
        (filters.amount_range && (filters.amount_range.min !== undefined || filters.amount_range.max !== undefined)) ||
        (filters.branch_id_filter && filters.branch_id_filter.length) ||
        dateBadgeLabel) && (
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

          {filters.payment_method_filter && filters.payment_method_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = filters.payment_method_filter!.map((pm) => paymentMethodLabel(pm));
                return labels.length <= 2 ? `Method: ${labels.join(', ')}` : `Method: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, payment_method_filter: undefined })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {filters.amount_range && (filters.amount_range.min !== undefined || filters.amount_range.max !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const min = filters.amount_range?.min;
                const max = filters.amount_range?.max;
                if (min !== undefined && max !== undefined) return `Amount: GHS${min} - GHS${max}`;
                if (min !== undefined) return `Amount: ≥ GHS${min}`;
                if (max !== undefined) return `Amount: ≤ GHS${max}`;
                return 'Amount: Any';
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, amount_range: undefined })}
              >
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

      {/* Advanced Filters */}
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
            {/* Payment Method Filter */}
            <div>
              <Label>Payment Method</Label>
              <Select
                value={pendingFilters.payment_method_filter?.[0] || 'all'}
                onValueChange={(value) => {
                  setPendingFilters({
                    ...pendingFilters,
                    payment_method_filter: value === 'all' ? undefined : [value as any],
                  });
                }}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  {paymentMethodOptionsConst.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Range */}
            <div>
              <Label>Amount Range</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={pendingFilters.amount_range?.min ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setPendingFilters({
                      ...pendingFilters,
                      amount_range: {
                        ...(pendingFilters.amount_range || {}),
                        min: value,
                      },
                    });
                  }}
                />
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={pendingFilters.amount_range?.max ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setPendingFilters({
                      ...pendingFilters,
                      amount_range: {
                        ...(pendingFilters.amount_range || {}),
                        max: value,
                      },
                    });
                  }}
                />
              </div>
            </div>

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
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowFilters(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                onFiltersChange({ ...pendingFilters });
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