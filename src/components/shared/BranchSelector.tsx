import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useBranches } from '@/hooks/queries';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRoleCheck } from '@/registry/access/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBranches } from '@/hooks/useBranchQueries';

// Base interface for common props
interface BaseBranchSelectorProps {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showActiveOnly?: boolean;
}

// Single Branch Selector
interface SingleBranchSelectorProps extends BaseBranchSelectorProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  allowClear?: boolean;
}

export function SingleBranchSelector({
  value,
  onValueChange,
  placeholder = 'Select branch...',
  disabled = false,
  className,
  showActiveOnly = true,
  allowClear = false,
}: SingleBranchSelectorProps) {
  const { currentOrganization } = useOrganization();
  const { data: branches = [], isLoading } = useBranches(
    currentOrganization?.id
  );
  const { canManageAllData } = useRoleCheck();
  const { user } = useAuth();
  const { data: userBranches = [] } = useUserBranches(
    user?.id,
    currentOrganization?.id
  );

  // Filter branches based on showActiveOnly prop
  const filteredBranches = useMemo(() => {
    return showActiveOnly
      ? branches.filter((branch) => branch.is_active)
      : branches;
  }, [branches, showActiveOnly]);

  const assignedBranchIds = useMemo(
    () => userBranches.map((ub) => ub.branch_id).filter(Boolean) as string[],
    [userBranches]
  );

  const visibleBranches = useMemo(() => {
    const base = canManageAllData()
      ? filteredBranches
      : filteredBranches.filter((b) => assignedBranchIds.includes(b.id));
    if (value && !base.some((b) => b.id === value)) {
      const current = filteredBranches.find((b) => b.id === value);
      return current ? [current, ...base] : base;
    }
    return base;
  }, [filteredBranches, assignedBranchIds, canManageAllData, value]);

  const selectedBranch = visibleBranches.find((branch) => branch.id === value);

  const handleValueChange = (branchId: string) => {
    if (branchId === 'clear') {
      onValueChange(undefined);
    } else {
      onValueChange(branchId);
    }
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={cn('w-full', className)}>
          <SelectValue placeholder="Loading branches..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={value || ''}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder}>
          {selectedBranch?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {allowClear && value && (
          <SelectItem value="clear" className="text-muted-foreground">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Clear selection
            </div>
          </SelectItem>
        )}
        {visibleBranches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span>{branch.name}</span>
              </div>
              {!branch.is_active && (
                <Badge variant="secondary" className="ml-2">
                  Inactive
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
        {visibleBranches.length === 0 && (
          <SelectItem value="__none__" disabled>
            No branches found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

// Multi Branch Selector
interface MultiBranchSelectorProps extends BaseBranchSelectorProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  allowSelectAll?: boolean;
  selectAllLabel?: string;
  showBadges?: boolean;
  maxBadges?: number;
}

export function MultiBranchSelector({
  value,
  onValueChange,
  placeholder = 'Select branches...',
  disabled = false,
  className,
  showActiveOnly = true,
  allowSelectAll = false,
  selectAllLabel = 'All Branches',
  showBadges = true,
  maxBadges = 3,
}: MultiBranchSelectorProps) {
  const { currentOrganization } = useOrganization();
  const { data: branches = [], isLoading } = useBranches(
    currentOrganization?.id
  );
  const { canManageAllData } = useRoleCheck();
  const { user } = useAuth();
  const { data: userBranches = [] } = useUserBranches(
    user?.id,
    currentOrganization?.id
  );
  const [open, setOpen] = useState(false);

  // Filter branches based on showActiveOnly prop
  const filteredBranches = useMemo(() => {
    return showActiveOnly
      ? branches.filter((branch) => branch.is_active)
      : branches;
  }, [branches, showActiveOnly]);

  const assignedBranchIds = useMemo(
    () => userBranches.map((ub) => ub.branch_id).filter(Boolean) as string[],
    [userBranches]
  );

  const visibleBranches = useMemo(() => {
    if (canManageAllData()) return filteredBranches;
    return filteredBranches.filter((b) => assignedBranchIds.includes(b.id));
  }, [filteredBranches, assignedBranchIds, canManageAllData]);

  const selectedBranches = useMemo(() => {
    const byId = new Map(filteredBranches.map((b) => [b.id, b] as const));
    return value.map((id) => byId.get(id)).filter(Boolean) as typeof filteredBranches;
  }, [filteredBranches, value]);

  const isAllSelected = useMemo(() => {
    return (
      visibleBranches.length > 0 &&
      visibleBranches.every((branch) => value.includes(branch.id))
    );
  }, [visibleBranches, value]);

  const handleSelect = (branchId: string) => {
    if (branchId === 'all' && allowSelectAll) {
      // Toggle select all
      const allBranchIds = visibleBranches.map((branch) => branch.id);
      onValueChange(isAllSelected ? [] : allBranchIds);
    } else {
      // Toggle individual branch
      const newValues = value.includes(branchId)
        ? value.filter((id) => id !== branchId)
        : [...value, branchId];
      onValueChange(newValues);
    }
  };

  const removeBranch = (branchId: string) => {
    onValueChange(value.filter((id) => id !== branchId));
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (allowSelectAll && isAllSelected) return selectAllLabel;
    if (value.length === 1) {
      const branch = selectedBranches[0];
      return branch?.name || placeholder;
    }
    return `${value.length} branches selected`;
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className={cn(
              'justify-between w-full',
              value.length === 0 && 'text-muted-foreground',
              className
            )}
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search branches..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading branches...' : 'No branches found.'}
              </CommandEmpty>
              <CommandGroup>
                {allowSelectAll && (
                  <CommandItem
                    value="all"
                    onSelect={() => handleSelect('all')}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isAllSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="font-medium">{selectAllLabel}</span>
                  </CommandItem>
                )}
                {visibleBranches.map((branch) => (
                  <CommandItem
                    key={branch.id}
                    value={branch.name}
                    onSelect={() => handleSelect(branch.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(branch.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col flex-1">
                      <span>{branch.name}</span>
                    </div>
                    {!branch.is_active && (
                      <Badge variant="secondary" className="ml-auto">
                        Inactive
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showBadges && selectedBranches.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedBranches.slice(0, maxBadges).map((branch) => (
            <Badge
              key={branch.id}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => removeBranch(branch.id)}
            >
              {branch.name}
              <button
                type="button"
                className="ml-1 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removeBranch(branch.id);
                }}
              >
                ×
              </button>
            </Badge>
          ))}
          {selectedBranches.length > maxBadges && (
            <Badge variant="outline">
              +{selectedBranches.length - maxBadges} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Main BranchSelector with variant support
interface BranchSelectorProps extends BaseBranchSelectorProps {
  variant: 'single' | 'multi';
  value?: string | string[];
  onValueChange: (value: string | string[] | undefined) => void;
  allowClear?: boolean;
  allowSelectAll?: boolean;
  selectAllLabel?: string;
  showBadges?: boolean;
  maxBadges?: number;
}

export function BranchSelector({
  variant,
  value,
  onValueChange,
  allowClear = false,
  allowSelectAll = false,
  selectAllLabel = 'All Branches',
  showBadges = true,
  maxBadges = 3,
  ...baseProps
}: BranchSelectorProps) {
  if (variant === 'single') {
    return (
      <SingleBranchSelector
        {...baseProps}
        value={typeof value === 'string' ? value : undefined}
        onValueChange={onValueChange as (value: string | undefined) => void}
        allowClear={allowClear}
      />
    );
  }

  return (
    <MultiBranchSelector
      {...baseProps}
      value={Array.isArray(value) ? value : []}
      onValueChange={onValueChange as (value: string[]) => void}
      allowSelectAll={allowSelectAll}
      selectAllLabel={selectAllLabel}
      showBadges={showBadges}
      maxBadges={maxBadges}
    />
  );
}
