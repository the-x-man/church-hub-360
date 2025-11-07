import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import type { DateFilter, DatePreset, FinanceFilter } from '@/types/finance';
import { format } from 'date-fns';
import { CalendarIcon, Download, Filter, Plus, Search, X } from 'lucide-react';
import React from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FinanceFilterBarProps {
  filters: FinanceFilter;
  onFiltersChange: (filters: FinanceFilter) => void;
  categoryOptions?: FilterOption[];
  memberOptions?: FilterOption[];
  paymentMethodOptions?: FilterOption[];
  searchPlaceholder?: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
  onExportClick?: () => void;
  addButtonLabel?: string;
  recordTypeFilter?: 'all' | 'contribution' | 'donation';
  onRecordTypeFilterChange?: (
    recordTypeFilter: 'all' | 'contribution' | 'donation'
  ) => void;
}

const datePresetOptions: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
];

export const FinanceFilterBar: React.FC<FinanceFilterBarProps> = ({
  filters,
  onFiltersChange,
  categoryOptions = [],
  memberOptions = [],
  paymentMethodOptions = [],
  searchPlaceholder = 'Search records...',
  showAddButton = true,
  onAddClick,
  onExportClick,
  addButtonLabel = 'Add Record',
  recordTypeFilter = 'all',
  onRecordTypeFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);

  const updateDateFilter = (dateFilter: Partial<DateFilter>) => {
    onFiltersChange({
      ...filters,
      date_filter: { ...filters.date_filter, ...dateFilter },
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      date_filter: { type: 'preset', preset: 'this_month' },
    });
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category_filter?.length) count++;
    if (filters.member_filter?.length) count++;
    if (filters.payment_method_filter?.length) count++;
    if (filters.status_filter?.length) count++;
    if (filters.amount_range?.min || filters.amount_range?.max) count++;
    return count;
  };

  const formatDateRange = () => {
    if (filters.date_filter.type === 'preset' && filters.date_filter.preset) {
      const preset = datePresetOptions.find(
        (p) => p.value === filters.date_filter.preset
      );
      return preset?.label || 'Custom';
    }

    if (filters.date_filter.start_date && filters.date_filter.end_date) {
      return `${format(
        new Date(filters.date_filter.start_date),
        'MMM dd'
      )} - ${format(new Date(filters.date_filter.end_date), 'MMM dd')}`;
    }

    return 'Select dates';
  };

  return (
    <div className="space-y-4">
      {/* Top row with search, date filter, and actions */}
      <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Record Type Filter */}
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
                <SelectItem value="contribution">Contributions only</SelectItem>
                <SelectItem value="donation">Donations only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
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
              <div className="p-4 space-y-4">
                <div>
                  <Label>Quick Select</Label>
                  <Select
                    value={filters.date_filter.preset || ''}
                    onValueChange={(value) =>
                      updateDateFilter({
                        type: 'preset',
                        preset: value as DatePreset,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {datePresetOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Custom Range</Label>
                  <div className="mt-1">
                    <Calendar
                      mode="range"
                      selected={{
                        from: filters.date_filter.start_date
                          ? new Date(filters.date_filter.start_date)
                          : undefined,
                        to: filters.date_filter.end_date
                          ? new Date(filters.date_filter.end_date)
                          : undefined,
                      }}
                      onSelect={(range) => {
                        updateDateFilter({
                          type: 'custom',
                          start_date: range?.from?.toISOString(),
                          end_date: range?.to?.toISOString(),
                          preset: undefined,
                        });
                      }}
                      numberOfMonths={2}
                    />
                  </div>
                </div>
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
            {categoryOptions.length > 0 && (
              <div>
                <Label>Category</Label>
                <Select
                  value={filters.category_filter?.[0] || 'all'}
                  onValueChange={(value) => {
                    onFiltersChange({
                      ...filters,
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

            {/* Member Filter */}
            {memberOptions.length > 0 && (
              <div>
                <Label>Member</Label>
                <Select
                  value={filters.member_filter?.[0] || 'all'}
                  onValueChange={(value) => {
                    onFiltersChange({
                      ...filters,
                      member_filter: value === 'all' ? undefined : [value],
                    });
                  }}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="All members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All members</SelectItem>
                    {memberOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Method Filter */}
            {paymentMethodOptions.length > 0 && (
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={filters.payment_method_filter?.[0] || 'all'}
                  onValueChange={(value) => {
                    onFiltersChange({
                      ...filters,
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
                    {paymentMethodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount Range */}
            <div>
              <Label>Amount Range</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={filters.amount_range?.min || ''}
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseFloat(e.target.value)
                      : undefined;
                    onFiltersChange({
                      ...filters,
                      amount_range: {
                        ...filters.amount_range,
                        min: value,
                      },
                    });
                  }}
                />
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={filters.amount_range?.max || ''}
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseFloat(e.target.value)
                      : undefined;
                    onFiltersChange({
                      ...filters,
                      amount_range: {
                        ...filters.amount_range,
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
                onFiltersChange({ ...filters });
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
