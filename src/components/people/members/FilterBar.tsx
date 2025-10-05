import { useState, useEffect } from 'react';
import { Search, Filter, X, Building, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DatePicker } from '@/components/shared/DatePicker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type {
  MemberFilters,
  MembershipType,
  MembershipStatus,
} from '@/types/members';
import { useDebounceValue } from '@/hooks/useDebounce';
import { TagFilter } from '@/components/people/tags/TagFilter';
import type { RelationalTagWithItems } from '@/hooks/useRelationalTags';

interface FilterBarProps {
  filters: MemberFilters;
  onFiltersChange: (filters: MemberFilters) => void;
  branches?: Array<{ id: string; name: string }>;
  membershipTypes?: MembershipType[];
  tags?: RelationalTagWithItems[];
  className?: string;
}

const membershipStatusOptions: {
  value: MembershipStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'deceased', label: 'Deceased' },
];

const ageRanges = [
  { value: 'all', label: 'All Ages' },
  { value: '0-17', label: 'Children (0-17)' },
  { value: '18-30', label: 'Young Adults (18-30)' },
  { value: '31-50', label: 'Adults (31-50)' },
  { value: '51-70', label: 'Mature Adults (51-70)' },
  { value: '71+', label: 'Seniors (71+)' },
  { value: 'custom', label: 'Custom Range...' },
];

export default function FilterBar({
  filters,
  onFiltersChange,
  branches = [],
  membershipTypes = [],
  tags = [],
  className,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateJoinedStart, setDateJoinedStart] = useState<string>('');
  const [dateJoinedEnd, setDateJoinedEnd] = useState<string>('');

  // Local search state for debouncing
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Custom age range state
  const [customAgeMin, setCustomAgeMin] = useState<string>('');
  const [customAgeMax, setCustomAgeMax] = useState<string>('');
  const [showCustomAgeRange, setShowCustomAgeRange] = useState(false);

  // Debounce the search value with 2 second delay
  const debouncedSearchValue = useDebounceValue(searchValue, 2000);

  // Update filters when debounced search value changes
  useEffect(() => {
    updateFilter('search', debouncedSearchValue);
  }, [debouncedSearchValue]);

  const updateFilter = (key: keyof MemberFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setDateJoinedStart('');
    setDateJoinedEnd('');
    setSearchValue('');
  };

  const handleAgeRangeChange = (value: string) => {
    if (value === 'all') {
      updateFilter('age_range', undefined);
    } else if (value === 'custom') {
      // Use setTimeout to ensure the Select dropdown closes before opening the popover
      setTimeout(() => {
        setShowCustomAgeRange(true);
      }, 200);
    } else {
      const [min, max] = value
        .split('-')
        .map((v) => (v === '+' ? undefined : parseInt(v)));
      updateFilter('age_range', { min, max });
    }
  };

  const handleCustomAgeRangeApply = () => {
    const min = customAgeMin ? parseInt(customAgeMin) : undefined;
    const max = customAgeMax ? parseInt(customAgeMax) : undefined;

    if (min !== undefined || max !== undefined) {
      updateFilter('age_range', { min, max });
    } else {
      updateFilter('age_range', undefined);
    }

    setShowCustomAgeRange(false);
  };

  const handleDateRangeChange = () => {
    if (dateJoinedStart || dateJoinedEnd) {
      updateFilter('date_joined_range', {
        start: dateJoinedStart || undefined,
        end: dateJoinedEnd || undefined,
      });
    } else {
      updateFilter('date_joined_range', undefined);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.membership_status && filters.membership_status !== 'all')
      count++;
    if (filters.membership_type && filters.membership_type !== 'all') count++;
    if (filters.branch_id && filters.branch_id !== 'all') count++;
    if (filters.gender && filters.gender !== 'all') count++;
    if (filters.age_range) count++;
    if (filters.date_joined_range) count++;
    if (filters.is_active !== 'all' && filters.is_active !== undefined) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Search and Quick Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name, email, phone, or membership ID..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Quick Status Filter */}
          <Select
            value={filters.membership_status || 'all'}
            onValueChange={(value) => updateFilter('membership_status', value)}
          >
            <SelectTrigger className="w-full sm:w-auto min-w-0">
              <UserCheck className="mr-2 h-4 w-4 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {membershipStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative w-full sm:w-auto"
          >
            <Filter className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              size="sm"
              className="w-full sm:w-auto"
            >
              <X className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          {/* Filter Controls Flex */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
            {/* Branch Filter */}
            {branches.length > 0 && (
              <div className="space-y-2 flex-1 min-w-0 sm:min-w-[200px]">
                <Label className="text-sm font-medium">Branch</Label>
                <Select
                  value={filters.branch_id || 'all'}
                  onValueChange={(value) => updateFilter('branch_id', value)}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <Building className="mr-2 h-4 w-4 flex-shrink-0" />
                      <SelectValue placeholder="All Branches" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Membership Type Filter */}
            {membershipTypes.length > 0 && (
              <div className="space-y-2 flex-1 min-w-0 sm:min-w-[200px]">
                <Label className="text-sm font-medium">Membership Type</Label>
                <Select
                  value={filters.membership_type || 'all'}
                  onValueChange={(value) =>
                    updateFilter('membership_type', value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                      <SelectValue placeholder="All Types" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {membershipTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Gender Filter */}
            <div className="space-y-2 flex-1 min-w-0 sm:min-w-[200px]">
              <Label className="text-sm font-medium">Gender</Label>
              <Select
                value={filters.gender || 'all'}
                onValueChange={(value) => updateFilter('gender', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tag Filter */}
            {tags.length > 0 && (
              <div className="space-y-2 flex-1 min-w-0 sm:min-w-[200px]">
                <Label className="text-sm font-medium">Tags</Label>
                <TagFilter
                  tags={tags}
                  value={
                    filters.tag_items && filters.tag_filter_mode
                      ? {
                          tag_items: filters.tag_items,
                          tag_filter_mode: filters.tag_filter_mode,
                        }
                      : undefined
                  }
                  onChange={(value) => {
                    if (value) {
                      updateFilter('tag_items', value.tag_items);
                      updateFilter('tag_filter_mode', value.tag_filter_mode);
                    } else {
                      updateFilter('tag_items', undefined);
                      updateFilter('tag_filter_mode', undefined);
                    }
                  }}
                />
              </div>
            )}

            {/* Age Range Filter */}
            <div className="space-y-2 flex-1 min-w-0 sm:min-w-[200px]">
              <Label className="text-sm font-medium">Age Range</Label>
              <div className="relative">
                <Select
                  value={
                    filters.age_range
                      ? (() => {
                          const { min, max } = filters.age_range;
                          // Check if it matches any predefined range
                          const predefinedRange = ageRanges.find((range) => {
                            if (
                              range.value === 'all' ||
                              range.value === 'custom'
                            )
                              return false;
                            if (range.value.includes('+')) {
                              const minAge = parseInt(
                                range.value.split('+')[0]
                              );
                              return min === minAge && max === undefined;
                            } else {
                              const [rangeMin, rangeMax] = range.value
                                .split('-')
                                .map(Number);
                              return min === rangeMin && max === rangeMax;
                            }
                          });

                          return predefinedRange
                            ? predefinedRange.value
                            : 'custom';
                        })()
                      : 'all'
                  }
                  onValueChange={handleAgeRangeChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Ages">
                      {filters.age_range
                        ? (() => {
                            const { min, max } = filters.age_range;
                            // Check if it matches any predefined range
                            const predefinedRange = ageRanges.find((range) => {
                              if (
                                range.value === 'all' ||
                                range.value === 'custom'
                              )
                                return false;
                              if (range.value.includes('+')) {
                                const minAge = parseInt(
                                  range.value.split('+')[0]
                                );
                                return min === minAge && max === undefined;
                              } else {
                                const [rangeMin, rangeMax] = range.value
                                  .split('-')
                                  .map(Number);
                                return min === rangeMin && max === rangeMax;
                              }
                            });

                            if (predefinedRange) {
                              return predefinedRange.label;
                            } else {
                              // Display custom range
                              if (min !== undefined && max !== undefined) {
                                return `${min}-${max} years`;
                              } else if (min !== undefined) {
                                return `${min}+ years`;
                              } else if (max !== undefined) {
                                return `0-${max} years`;
                              }
                            }
                          })()
                        : 'All Ages'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ageRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover
                  open={showCustomAgeRange}
                  onOpenChange={setShowCustomAgeRange}
                >
                  <PopoverTrigger asChild>
                    <div></div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                          Custom Age Range
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Set a custom age range for filtering members.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="min-age" className="text-xs">
                            Min Age
                          </Label>
                          <Input
                            id="min-age"
                            type="number"
                            placeholder="0"
                            value={customAgeMin}
                            onChange={(e) => setCustomAgeMin(e.target.value)}
                            min="0"
                            max="150"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="max-age" className="text-xs">
                            Max Age
                          </Label>
                          <Input
                            id="max-age"
                            type="number"
                            placeholder="100"
                            value={customAgeMax}
                            onChange={(e) => setCustomAgeMax(e.target.value)}
                            min="0"
                            max="150"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCustomAgeMin('');
                            setCustomAgeMax('');
                            setShowCustomAgeRange(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleCustomAgeRangeApply}>
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Date Joined Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Joined Range</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <DatePicker
                value={dateJoinedStart}
                onChange={setDateJoinedStart}
                placeholder="Start date"
                className="w-full sm:w-auto"
                disableFuture={true}
              />

              <DatePicker
                value={dateJoinedEnd}
                onChange={setDateJoinedEnd}
                placeholder="End date"
                className="w-full sm:w-auto"
                disableFuture={true}
                minDate={dateJoinedStart || undefined}
              />

              <Button
                onClick={handleDateRangeChange}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => {
                  setSearchValue('');
                  updateFilter('search', '');
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filters.membership_status && filters.membership_status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.membership_status}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => updateFilter('membership_status', 'all')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filters.membership_type && filters.membership_type !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.membership_type}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => updateFilter('membership_type', 'all')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filters.branch_id && filters.branch_id !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Branch:{' '}
              {branches.find((b) => b.id === filters.branch_id)?.name ||
                'Unknown'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => updateFilter('branch_id', 'all')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filters.gender && filters.gender !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Gender: {filters.gender}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => updateFilter('gender', 'all')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filters.tag_items && filters.tag_items.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Tags: {filters.tag_items.length} selected ({filters.tag_filter_mode || 'any'})
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => {
                  updateFilter('tag_items', undefined);
                  updateFilter('tag_filter_mode', undefined);
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {filters.age_range &&
            (filters.age_range.min !== undefined ||
              filters.age_range.max !== undefined) && (
              <Badge variant="secondary" className="gap-1">
                Age:{' '}
                {filters.age_range.min !== undefined &&
                filters.age_range.max !== undefined
                  ? `${filters.age_range.min}-${filters.age_range.max}`
                  : filters.age_range.min !== undefined
                  ? `${filters.age_range.min}+`
                  : `0-${filters.age_range.max}`}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                  onClick={() => updateFilter('age_range', null)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}
          {(filters.date_joined_range?.start ||
            filters.date_joined_range?.end) && (
            <Badge variant="secondary" className="gap-1">
              Joined:{' '}
              {filters.date_joined_range.start && filters.date_joined_range.end
                ? `${format(
                    new Date(filters.date_joined_range.start),
                    'MMM dd, yyyy'
                  )} - ${format(
                    new Date(filters.date_joined_range.end),
                    'MMM dd, yyyy'
                  )}`
                : filters.date_joined_range.start
                ? `After ${format(
                    new Date(filters.date_joined_range.start),
                    'MMM dd, yyyy'
                  )}`
                : `Before ${format(
                    new Date(filters.date_joined_range.end!),
                    'MMM dd, yyyy'
                  )}`}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                onClick={() => {
                  updateFilter('date_joined_range', null);
                  setDateJoinedStart('');
                  setDateJoinedEnd('');
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
