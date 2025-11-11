import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DateFilter, FinanceFilter, IncomeType } from '@/types/finance';
import { format } from 'date-fns';
import { CalendarIcon, Download, Filter, Plus, Search, X } from 'lucide-react';
import React from 'react';
import { paymentMethodOptions as paymentMethodOptionsConst } from './constants';
import { DatePresetPicker, type DatePresetValue } from '@/components/attendance/reports/DatePresetPicker';
import { mapPickerToDateFilter, mapDateFilterToPicker } from '@/utils/finance/dateFilter';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { GroupSelect } from '@/components/finance/GroupSelect';
import { TagItemSelect } from '@/components/finance/TagItemSelect';
import { OccasionSessionSelector } from '@/components/shared/OccasionSessionSelector';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useMemberDetails, type MemberSearchResult } from '@/hooks/useMemberSearch';
import { useOccasionDetails, useSessionDetails } from '@/hooks/attendance/useAttendanceSearch';
import { useGroup } from '@/hooks/useGroups';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import { useDebounceValue } from '@/hooks/useDebounce';
import { Switch } from '@/components/ui/switch';
import type { AmountComparison, AmountOperator } from '@/utils/finance/search';

interface FilterOption {
  value: string;
  label: string;
}

type FinanceFilterVisibilityKey =
  | 'category'
  | 'member'
  | 'payment_method'
  | 'amount_range'
  | 'group'
  | 'tag_item'
  | 'occasion'
  | 'session'
  | 'income_type';

interface FinanceFilterBarProps {
  filters: FinanceFilter;
  onFiltersChange: (filters: FinanceFilter) => void;
  categoryOptions?: FilterOption[];
  paymentMethodOptions?: FilterOption[];
  searchPlaceholder?: string;
  onSearchChange?: (search?: string) => void;
  amountSearch?: AmountComparison | null;
  onAmountSearchChange?: (cmp: AmountComparison | null) => void;
  showAddButton?: boolean;
  onAddClick?: () => void;
  onExportClick?: () => void;
  addButtonLabel?: string;
  recordTypeFilter?: 'all' | IncomeType;
  onRecordTypeFilterChange?: (recordTypeFilter: 'all' | IncomeType) => void;
  filterVisibility?: Partial<Record<FinanceFilterVisibilityKey, boolean>>;
  incomeTypeFilterOptions?: IncomeType[];
}


export const FinanceFilterBar: React.FC<FinanceFilterBarProps> = ({
  filters,
  onFiltersChange,
  categoryOptions = [],
  paymentMethodOptions = [],
  searchPlaceholder = 'Search records...',
  onSearchChange,
  amountSearch,
  onAmountSearchChange,
  showAddButton = true,
  onAddClick,
  onExportClick,
  addButtonLabel = 'Add Record',
  recordTypeFilter = 'all',
  onRecordTypeFilterChange,
  filterVisibility,
  incomeTypeFilterOptions = ['general_income', 'contribution', 'donation', 'pledge_payment'],
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);
  const [showFilters, setShowFilters] = React.useState(false);
  const [pendingFilters, setPendingFilters] = React.useState<FinanceFilter>(filters);
  const { currentOrganization } = useOrganization();

  // Local amount search mode state
  const [searchMode, setSearchMode] = React.useState<'text' | 'amount'>('text');
  const [amountOperator, setAmountOperator] = React.useState<AmountOperator>('=');
  const [amountInput, setAmountInput] = React.useState<string>('');

  // Propagate debounced search term to parent
  React.useEffect(() => {
    const next = debouncedSearchTerm?.trim();
    if (!onSearchChange) return;
    if (searchMode === 'text') {
      onSearchChange(next ? next : undefined);
    }
  }, [debouncedSearchTerm, onSearchChange, searchMode]);

  // When switching modes, clear counterpart search
  React.useEffect(() => {
    if (searchMode === 'amount') {
      // Clear text search when entering amount mode
      setSearchTerm('');
      onSearchChange?.(undefined);
    } else {
      // Clear amount search when switching back to text mode
      setAmountInput('');
      setAmountOperator('=');
      onAmountSearchChange?.(null);
    }
  }, [searchMode]);

  // Sync pending filters when advanced panel opens or when external filters change
  React.useEffect(() => {
    if (showFilters) setPendingFilters(filters);
  }, [showFilters, filters]);

  const isVisible = React.useCallback(
    (key: FinanceFilterVisibilityKey) => filterVisibility?.[key] !== false,
    [filterVisibility]
  );

  // Date preset mapping state
  const [datePresetValue, setDatePresetValue] = React.useState<DatePresetValue>(
    mapDateFilterToPicker(filters.date_filter)
  );
  React.useEffect(() => {
    setDatePresetValue(mapDateFilterToPicker(filters.date_filter));
  }, [filters.date_filter]);

  // Prefill typeahead values for member/occasion/session based on pending filters
  const { data: memberDetails = [] } = useMemberDetails(pendingFilters.member_filter || []);
  const memberTypeaheadValue: MemberSearchResult[] = React.useMemo(() => {
    return memberDetails.map((m: any) => ({
      ...m,
      display_name: m.full_name || `${m.first_name} ${m.last_name}` || 'Member',
      display_subtitle: m.email || m.phone || '',
    }));
  }, [memberDetails]);

  const { data: occasionDetails = [] } = useOccasionDetails(pendingFilters.attendance_occasion_filter || []);
  const { data: sessionDetails = [] } = useSessionDetails(pendingFilters.attendance_session_filter || []);

  // Deprecated in favor of DatePresetPicker direct mapping

  const clearAllFilters = () => {
    setPendingFilters({
      ...filters,
      category_filter: undefined,
      member_filter: undefined,
      payment_method_filter: undefined,
      status_filter: undefined,
      amount_range: undefined,
      group_filter: undefined,
      tag_item_filter: undefined,
      attendance_occasion_filter: undefined,
      attendance_session_filter: undefined,
      income_type_filter: undefined,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category_filter?.length) count++;
    if (filters.member_filter?.length) count++;
    if (filters.payment_method_filter?.length) count++;
    if (filters.status_filter?.length) count++;
    if (filters.amount_range?.min || filters.amount_range?.max) count++;
    if (filters.group_filter?.length) count++;
    if (filters.tag_item_filter?.length) count++;
    if (filters.attendance_occasion_filter?.length) count++;
    if (filters.attendance_session_filter?.length) count++;
    if (filters.income_type_filter?.length) count++;
    return count;
  };

  const formatDateRange = () => {
    const from = datePresetValue?.range?.from;
    const to = datePresetValue?.range?.to;
    if (from && to) {
      return `${format(from, 'MMM dd')} - ${format(to, 'MMM dd')}`;
    }
    return 'Select dates';
  };

  // Active filter details for badges (based on applied filters, not pending)
  const { data: activeMemberDetails = [] } = useMemberDetails(filters.member_filter || []);
  const { data: activeOccasionDetails = [] } = useOccasionDetails(filters.attendance_occasion_filter || []);
  const { data: activeSessionDetails = [] } = useSessionDetails(filters.attendance_session_filter || []);
  const { data: activeGroup } = useGroup(filters.group_filter?.[0] || null);
  const { data: orgTags = [] } = useTagsQuery(currentOrganization?.id);

  const getPresetLabel = (preset?: string) => {
    switch (preset) {
      case 'last_3_days':
        return 'Last 3 Days';
      case 'last_7_days':
        return 'Last 7 Days';
      case 'last_15_days':
        return 'Last 15 Days';
      case 'last_30_days':
        return 'Last 30 Days';
      case 'last_60_days':
        return 'Last 60 Days';
      case 'last_90_days':
        return 'Last 90 Days';
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'this_week':
        return 'This Week';
      case 'last_week':
        return 'Last Week';
      case 'this_month':
        return 'This Month';
      case 'last_month':
        return 'Last Month';
      case 'last_2_months':
        return 'Last 2 Months';
      case 'last_3_months':
        return 'Last 3 Months';
      case 'this_quarter':
        return 'This Quarter';
      case 'last_quarter':
        return 'Last Quarter';
      case 'this_year':
        return 'This Year';
      case 'last_year':
        return 'Last Year';
      default:
        return 'Custom Range';
    }
  };

  const dateBadgeLabel = React.useMemo(() => {
    const df = filters.date_filter;
    if (df.type === 'preset' && df.preset) {
      return `Date: ${getPresetLabel(df.preset)}`;
    }
    if (df.type === 'custom' && df.start_date && df.end_date) {
      return `Date: ${format(new Date(df.start_date), 'MMM dd, yyyy')} - ${format(new Date(df.end_date), 'MMM dd, yyyy')}`;
    }
    return undefined;
  }, [filters.date_filter]);

  const paymentMethodLabel = (pm: string) => {
    const pool = (paymentMethodOptions.length > 0 ? paymentMethodOptions : paymentMethodOptionsConst);
    return pool.find((p) => p.value === pm)?.label || pm;
  };

  const categoryLabel = (cat: string) => {
    return categoryOptions.find((c) => c.value === cat)?.label || cat;
  };

  return (
    <div className="space-y-4">
      {/* Top row with search, date filter, and actions */}
      <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center">
          {/* Search mode toggle */}
          <div className="flex items-center gap-2">
            <Label htmlFor="amount-mode" className="text-xs">Amount</Label>
            <Switch
              id="amount-mode"
              checked={searchMode === 'amount'}
              onCheckedChange={(checked) => setSearchMode(checked ? 'amount' : 'text')}
            />
          </div>

          {/* Operator select when amount mode */}
          {searchMode === 'amount' && (
            <div className="min-w-[110px]">
              <Select
                value={amountOperator}
                onValueChange={(v) => setAmountOperator(v as AmountOperator)}
              >
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
                  // Strip leading operator if user edits it inline, keep only numeric part after operator
                  const cleaned = raw.replace(/^\s*([<>]=?|!?=)?\s*/, '');
                  // Allow digits, commas, dot
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
                  // If invalid, clear any applied amount search
                  onAmountSearchChange?.(null);
                }
              }}
              disabled={!amountInput.trim()}
            >
              Apply
            </Button>
          )}

          {/* Income Type Filter (Dynamic) */}
          <div>
            <Select
              value={recordTypeFilter}
              onValueChange={(v) => onRecordTypeFilterChange?.(v as any)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All records" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All records</SelectItem>
                {incomeTypeFilterOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t
                      .split('_')
                      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                      .join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter using DatePresetPicker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
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
                    onFiltersChange({
                      ...filters,
                      date_filter: df,
                    });
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {onExportClick && (
            <Button variant="outline" onClick={onExportClick}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {showAddButton && onAddClick && (
            <Button onClick={onAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              {addButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {(dateBadgeLabel || (searchMode === 'text' && debouncedSearchTerm) || amountSearch ||
        (filters.category_filter && filters.category_filter.length) ||
        (filters.member_filter && filters.member_filter.length) ||
        (filters.payment_method_filter && filters.payment_method_filter.length) ||
        (filters.amount_range && (filters.amount_range.min !== undefined || filters.amount_range.max !== undefined)) ||
        (filters.group_filter && filters.group_filter.length) ||
        (filters.tag_item_filter && filters.tag_item_filter.length) ||
        (filters.attendance_occasion_filter && filters.attendance_occasion_filter.length) ||
        (filters.attendance_session_filter && filters.attendance_session_filter.length) ||
        (filters.income_type_filter && filters.income_type_filter.length) ||
        (recordTypeFilter && recordTypeFilter !== 'all')) && (
        <div className="flex flex-wrap gap-2">
          {/* Date filter badge */}
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

          {/* Search term (text mode) */}
          {searchMode === 'text' && debouncedSearchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: {debouncedSearchTerm}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => {
                  setSearchTerm('');
                  onSearchChange?.(undefined);
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Amount search badge (amount mode) */}
          {amountSearch && (
            <Badge variant="secondary" className="gap-1">
              Amount: {amountSearch.operator} {amountSearch.value}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => {
                  setAmountInput('');
                  setAmountOperator('=');
                  onAmountSearchChange?.(null);
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Record type quick filter */}
          {recordTypeFilter && recordTypeFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {recordTypeFilter.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onRecordTypeFilterChange?.('all')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Category filter */}
          {filters.category_filter && filters.category_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = filters.category_filter!.map(categoryLabel);
                return labels.length <= 2
                  ? `Category: ${labels.join(', ')}`
                  : `Category: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, category_filter: undefined })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Payment methods */}
          {filters.payment_method_filter && filters.payment_method_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = filters.payment_method_filter!.map((pm) => paymentMethodLabel(pm));
                return labels.length <= 2
                  ? `Payment: ${labels.join(', ')}`
                  : `Payment: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
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

          {/* Amount range */}
          {filters.amount_range && (filters.amount_range.min !== undefined || filters.amount_range.max !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const min = filters.amount_range?.min;
                const max = filters.amount_range?.max;
                if (min !== undefined && max !== undefined) return `Amount: ${min} - ${max}`;
                if (min !== undefined) return `Amount: ≥ ${min}`;
                if (max !== undefined) return `Amount: ≤ ${max}`;
                return 'Amount';
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

          {/* Group */}
          {filters.group_filter && filters.group_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Group: {activeGroup?.name || 'Unknown'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, group_filter: undefined })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Tag item */}
          {filters.tag_item_filter && filters.tag_item_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const itemId = filters.tag_item_filter?.[0];
                const itemName = orgTags
                  .flatMap((t) => t.tag_items || [])
                  .find((it) => it.id === itemId)?.name || 'Tag Item';
                return `Tag: ${itemName}`;
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, tag_item_filter: undefined })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Occasion */}
          {filters.attendance_occasion_filter && filters.attendance_occasion_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = activeOccasionDetails.map((o: any) => o.display_name || 'Occasion');
                return labels.length <= 2
                  ? `Occasion: ${labels.join(', ')}`
                  : `Occasion: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, attendance_occasion_filter: undefined })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Session */}
          {filters.attendance_session_filter && filters.attendance_session_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = activeSessionDetails.map((s: any) => s.display_name || 'Session');
                return labels.length <= 2
                  ? `Session: ${labels.join(', ')}`
                  : `Session: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, attendance_session_filter: undefined })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Income type (advanced filter) */}
          {filters.income_type_filter && filters.income_type_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = filters.income_type_filter!.map((t) => t.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '));
                return labels.length <= 2
                  ? `Filter: ${labels.join(', ')}`
                  : `Filter: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, income_type_filter: undefined })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Members */}
          {filters.member_filter && filters.member_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = activeMemberDetails.map((m: any) => {
                  const name = m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim();
                  return name || 'Member';
                });
                return labels.length <= 2
                  ? `Members: ${labels.join(', ')}`
                  : `Members: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, member_filter: undefined })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Expanded filters */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Advanced Filters</h3>
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            {isVisible('category') && categoryOptions.length > 0 && (
              <div>
                <Label>Category</Label>
                <Select
                  value={pendingFilters.category_filter?.[0] || 'all'}
                  onValueChange={(value) => {
                    setPendingFilters({
                      ...pendingFilters,
                      category_filter: value === 'all' ? undefined : [value],
                    });
                  }}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Member Filter (Typeahead, multi-select) */}
            {isVisible('member') && (
              <div>
                <Label>Member</Label>
                <MemberSearchTypeahead
                  organizationId={currentOrganization?.id || ''}
                  value={memberTypeaheadValue}
                  onChange={(items) =>
                    setPendingFilters({
                      ...pendingFilters,
                      member_filter: items.length ? items.map((m) => String(m.id)) : undefined,
                    })
                  }
                  multiSelect
                  placeholder="Search members"
                />
              </div>
            )}

            {/* Payment Method Filter */}
            {isVisible('payment_method') && (paymentMethodOptions.length > 0 || paymentMethodOptionsConst.length > 0) && (
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={pendingFilters.payment_method_filter?.[0] || 'all'}
                  onValueChange={(value) => {
                    setPendingFilters({
                      ...pendingFilters,
                      payment_method_filter:
                        value === 'all' ? undefined : [value as any],
                    });
                  }}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All methods</SelectItem>
                    {(paymentMethodOptions.length > 0 ? paymentMethodOptions : paymentMethodOptionsConst).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount Range */}
            {isVisible('amount_range') && (
              <div>
                <Label>Amount Range</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    placeholder="Min amount"
                    value={pendingFilters.amount_range?.min ?? ''}
                    onChange={(e) => {
                      const value = e.target.value
                        ? parseFloat(e.target.value)
                        : undefined;
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
                      const value = e.target.value
                        ? parseFloat(e.target.value)
                        : undefined;
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
            )}

            {/* Group Filter */}
            {isVisible('group') && (
              <GroupSelect
                label="Group"
                value={pendingFilters.group_filter?.[0]}
                onChange={(id) =>
                  setPendingFilters({
                    ...pendingFilters,
                    group_filter: id ? [id] : undefined,
                  })
                }
                className="min-w-0"
              />
            )}

            {/* Tag Item Filter */}
            {isVisible('tag_item') && (
              <TagItemSelect
                label="Tag Item"
                value={pendingFilters.tag_item_filter?.[0]}
                onChange={(id) =>
                  setPendingFilters({
                    ...pendingFilters,
                    tag_item_filter: id ? [id] : undefined,
                  })
                }
                className="min-w-0"
              />
            )}

            {/* Occasion & Session Filters */}
            {(isVisible('occasion') || isVisible('session')) && (
              <OccasionSessionSelector
                occasionValue={occasionDetails}
                onOccasionChange={(items) => {
                  setPendingFilters({
                    ...pendingFilters,
                    attendance_occasion_filter: items.map((i) => i.id),
                    attendance_session_filter: undefined,
                  });
                }}
                sessionValue={sessionDetails}
                onSessionChange={(items) => {
                  setPendingFilters({
                    ...pendingFilters,
                    attendance_session_filter: items.map((i) => i.id),
                  });
                }}
                className="min-w-0"
              />
            )}
          </div>

          {/* Apply button row */}
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
