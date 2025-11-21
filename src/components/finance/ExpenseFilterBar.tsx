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
import type { DateFilter, FinanceFilter } from '@/types/finance';
import { format } from 'date-fns';
import { CalendarIcon, Filter, Plus, Search, X } from 'lucide-react';
import React from 'react';
import { paymentMethodOptions as paymentMethodOptionsConst } from './constants';
import { DatePresetPicker, type DatePresetValue } from '@/components/attendance/reports/DatePresetPicker';
import { mapPickerToDateFilter, mapDateFilterToPicker } from '@/utils/finance/dateFilter';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useMemberDetails, type MemberSearchResult } from '@/hooks/useMemberSearch';
import { useExpensePreferences } from '@/hooks/finance/useExpensePreferences';
import { BranchSelector } from '@/components/shared/BranchSelector';
import { useBranches } from '@/hooks/useBranchQueries';

interface FilterOption {
  value: string;
  label: string;
}

interface ExpenseFilterBarProps {
  filters: FinanceFilter;
  onFiltersChange: (filters: FinanceFilter) => void;
  paymentMethodOptions?: FilterOption[];
  searchPlaceholder?: string;
  onSearchChange?: (search?: string) => void;
  showAddButton?: boolean;
  onAddClick?: () => void;
  addButtonLabel?: string;
}

export const ExpenseFilterBar: React.FC<ExpenseFilterBarProps> = ({
  filters,
  onFiltersChange,
  paymentMethodOptions = [],
  searchPlaceholder = 'Search expenses...',
  onSearchChange,
  showAddButton = true,
  onAddClick,
  addButtonLabel = 'Add Expense',
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [pendingFilters, setPendingFilters] = React.useState<FinanceFilter>(filters);
  const { currentOrganization } = useOrganization();
  const { purposeOptions, categoryKeys, categoryOptions, getPurposeOptions } = useExpensePreferences();

  // Sync pending filters when advanced panel opens or when external filters change
  React.useEffect(() => {
    if (showFilters) setPendingFilters(filters);
  }, [showFilters, filters]);

  // Date preset mapping state
  const [datePresetValue, setDatePresetValue] = React.useState<DatePresetValue>(
    mapDateFilterToPicker(filters.date_filter)
  );
  React.useEffect(() => {
    setDatePresetValue(mapDateFilterToPicker(filters.date_filter));
  }, [filters.date_filter]);

  // Prefill typeahead values for approved_by based on pending filters
  const { data: approvedDetails = [] } = useMemberDetails(pendingFilters.approved_by_filter || []);
  const approvedTypeaheadValue: MemberSearchResult[] = React.useMemo(() => {
    return approvedDetails.map((m: any) => ({
      ...m,
      display_name: m.full_name || `${m.first_name} ${m.last_name}` || 'Member',
      display_subtitle: m.email || m.phone || '',
    }));
  }, [approvedDetails]);

  const clearAllFilters = () => {
    setPendingFilters({
      ...filters,
      purpose_filter: undefined,
      category_filter: undefined,
      approved_by_filter: undefined,
      payment_method_filter: undefined,
      amount_range: undefined,
      branch_id_filter: undefined,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.purpose_filter?.length) count++;
    if (filters.category_filter?.length) count++;
    if (filters.approved_by_filter?.length) count++;
    if (filters.payment_method_filter?.length) count++;
    if (filters.branch_id_filter?.length) count++;
    if (filters.amount_range?.min || filters.amount_range?.max) count++;
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

  const paymentMethodLabel = (pm: string) => {
    const pool = (paymentMethodOptions.length > 0 ? paymentMethodOptions : paymentMethodOptionsConst);
    return pool.find((p) => p.value === pm)?.label || pm;
  };

  // Active filter details for badges (based on applied filters)
  const { data: activeApprovedDetails = [] } = useMemberDetails(filters.approved_by_filter || []);
  const { data: branches = [] } = useBranches(currentOrganization?.id);
  const activeBranchLabels: string[] = React.useMemo(() => {
    const ids = filters.branch_id_filter || [];
    if (!ids.length) return [];
    return ids
      .map((id) => branches.find((b: any) => b.id === id)?.name)
      .filter((n): n is string => !!n);
  }, [filters.branch_id_filter, branches]);

  return (
    <div className="space-y-4">
      {/* Top row with search, date filter, and actions */}
      <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center">
          <div className='flex flex-1 gap-2 items-center'>
            {/* Text search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  const next = e.target.value;
                  setSearchTerm(next);
                  onSearchChange?.(next.trim() ? next.trim() : undefined);
                }}
                className="pl-9"
              />
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

          {/* Add button */}
          {showAddButton && onAddClick && (
            <Button onClick={onAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              {addButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {(datePresetValue || filters.purpose_filter?.length || filters.category_filter?.length || filters.approved_by_filter?.length || filters.payment_method_filter?.length || (filters.amount_range && (filters.amount_range.min !== undefined || filters.amount_range.max !== undefined))) && (
        <div className="flex flex-wrap gap-2">
          {/* Date filter badge */}
          {(() => {
            const df = filters.date_filter;
            const label = (() => {
              if (df.type === 'preset' && df.preset) {
                const preset = df.preset;
                const map: Record<string, string> = {
                  last_3_days: 'Last 3 Days',
                  last_7_days: 'Last 7 Days',
                  last_15_days: 'Last 15 Days',
                  last_30_days: 'Last 30 Days',
                  last_60_days: 'Last 60 Days',
                  last_90_days: 'Last 90 Days',
                  today: 'Today',
                  yesterday: 'Yesterday',
                  this_week: 'This Week',
                  last_week: 'Last Week',
                  this_month: 'This Month',
                  last_month: 'Last Month',
                  last_2_months: 'Last 2 Months',
                  last_3_months: 'Last 3 Months',
                  this_quarter: 'This Quarter',
                  last_quarter: 'Last Quarter',
                  this_year: 'This Year',
                  last_year: 'Last Year',
                };
                return `Date: ${map[preset] || 'Custom Range'}`;
              }
              if (df.type === 'custom' && df.start_date && df.end_date) {
                return `Date: ${format(new Date(df.start_date), 'MMM dd, yyyy')} - ${format(new Date(df.end_date), 'MMM dd, yyyy')}`;
              }
              return undefined;
            })();
            return label ? (
              <Badge variant="secondary" className="gap-1">
                {label}
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
            ) : null;
          })()}

          {/* Purpose filter */}
          {filters.purpose_filter && filters.purpose_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = filters.purpose_filter!;
                return labels.length <= 2
                  ? `Purpose: ${labels.join(', ')}`
                  : `Purpose: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, purpose_filter: undefined })}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {/* Category filter */}
          {filters.category_filter && filters.category_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = filters.category_filter!.map((key) => {
                  const idx = categoryKeys.indexOf(key as any);
                  return idx >= 0 ? categoryOptions[idx] : key;
                });
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

          {/* Approved By */}
          {filters.approved_by_filter && filters.approved_by_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = activeApprovedDetails.map((m: any) => {
                  const name = m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim();
                  return name || 'Member';
                });
                return labels.length <= 2
                  ? `Approved By: ${labels.join(', ')}`
                  : `Approved By: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} more`;
              })()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFiltersChange({ ...filters, approved_by_filter: undefined })}
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

          {/* Branch */}
          {filters.branch_id_filter && filters.branch_id_filter.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {(() => {
                const labels = activeBranchLabels.length
                  ? activeBranchLabels
                  : filters.branch_id_filter!;
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
            <div>
              <Label>Category</Label>
              <Select
                value={pendingFilters.category_filter?.[0] || 'all'}
                onValueChange={(value) => {
                  const nextCategory = value === 'all' ? undefined : [value as any];
                  const selectedKey = value === 'all' ? undefined : (value as string);
                  const allowedPurposes = selectedKey ? (getPurposeOptions(selectedKey) as string[]) : (purposeOptions as string[]);
                  const currentPurpose = pendingFilters.purpose_filter?.[0];
                  const nextPurpose = currentPurpose && selectedKey && !allowedPurposes.includes(currentPurpose)
                    ? undefined
                    : pendingFilters.purpose_filter;
                  setPendingFilters({
                    ...pendingFilters,
                    category_filter: nextCategory,
                    purpose_filter: nextPurpose,
                  });
                }}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categoryKeys.map((key: string, idx: number) => (
                    <SelectItem key={key} value={key as any}>
                      {categoryOptions[idx]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Purpose</Label>
              <Select
                value={pendingFilters.purpose_filter?.[0] || 'all'}
                onValueChange={(value) => {
                  setPendingFilters({
                    ...pendingFilters,
                    purpose_filter: value === 'all' ? undefined : [value],
                  });
                }}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="All purposes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All purposes</SelectItem>
                  {(
                    (pendingFilters.category_filter?.[0]
                      ? (getPurposeOptions(pendingFilters.category_filter?.[0] as any) as string[])
                      : (purposeOptions as string[])
                    )
                  ).map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Approved By Filter (Typeahead, multi-select) */}
            <div>
              <Label>Approved By</Label>
              <MemberSearchTypeahead
                organizationId={currentOrganization?.id || ''}
                value={approvedTypeaheadValue}
                onChange={(items) =>
                  setPendingFilters({
                    ...pendingFilters,
                    approved_by_filter: items.length ? items.map((m) => String(m.id)) : undefined,
                  })
                }
                multiSelect
                placeholder="Search members"
              />
            </div>

            {/* Payment Method Filter */}
            {(paymentMethodOptions.length > 0 || paymentMethodOptionsConst.length > 0) && (
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