import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { POSITION_GROUPS } from '@/constants/groupPositions';
import type { Group } from '@/hooks/useGroups';

export interface GroupAssignment {
  groupId: string;
  position?: string;
}

interface GroupsRendererProps {
  groups: Group[];
  value?: GroupAssignment[];
  onChange?: (value: GroupAssignment[]) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
  branchId?: string;
  allowPositions?: boolean;
  maxSelections?: number;
}

export function GroupsRenderer({
  groups,
  value = [],
  onChange,
  disabled = false,
  error,
  className,
  branchId,
  allowPositions = true,
  maxSelections,
}: GroupsRendererProps) {
  const [open, setOpen] = useState(false);

  // Filter groups by branch if specified and only show active, non-closed groups
  const availableGroups = groups.filter((group) => {
    if (!group.is_active || group.is_closed) return false;
    if (branchId && group.branch_id !== branchId) return false;
    return true;
  });

  // Sort groups by name
  const sortedGroups = availableGroups.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const selectedGroupIds = value.map((assignment) => assignment.groupId);
  const selectedGroups = sortedGroups.filter((group) =>
    selectedGroupIds.includes(group.id)
  );

  const handleGroupToggle = (groupId: string, isSelected: boolean) => {
    if (!onChange) return;

    if (isSelected) {
      // Add group assignment
      if (maxSelections && value.length >= maxSelections) {
        return; // Don't add if max selections reached
      }
      const newAssignment: GroupAssignment = { groupId };
      onChange([...value, newAssignment]);
    } else {
      // Remove group assignment
      onChange(value.filter((assignment) => assignment.groupId !== groupId));
    }
  };

  const handlePositionChange = (groupId: string, position: string) => {
    if (!onChange) return;

    const updatedAssignments = value.map((assignment) =>
      assignment.groupId === groupId
        ? { ...assignment, position: position === 'none' ? 'Member' : position }
        : assignment
    );
    onChange(updatedAssignments);
  };

  const handleRemoveAssignment = (groupId: string) => {
    if (!onChange) return;
    onChange(value.filter((assignment) => assignment.groupId !== groupId));
  };

  const renderMultiselect = () => {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between min-h-[40px] h-auto',
              error && 'border-destructive',
              selectedGroups.length === 0 && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <div className="flex-1 text-left overflow-hidden">
              {selectedGroups.length === 0 ? (
                'Select groups'
              ) : (
                <div className="flex flex-wrap gap-1 py-1">
                  {selectedGroups.slice(0, 3).map((group) => (
                    <Badge
                      key={group.id}
                      variant="secondary"
                      className="text-xs shrink-0"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      {group.name}
                    </Badge>
                  ))}
                  {selectedGroups.length > 3 && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      +{selectedGroups.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search groups..." />
            <CommandEmpty>No groups found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[300px]">
                {sortedGroups.map((group) => {
                  const isSelected = selectedGroupIds.includes(group.id);
                  const isDisabled = Boolean(
                    disabled ||
                      (!isSelected &&
                        maxSelections &&
                        value.length >= maxSelections)
                  );

                  return (
                    <CommandItem
                      key={group.id}
                      onSelect={() => {
                        if (!isDisabled) {
                          handleGroupToggle(group.id, !isSelected);
                        }
                      }}
                      disabled={isDisabled}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{group.name}</div>
                          {group.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {group.description}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant={
                            group.type === 'permanent' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {group.type}
                        </Badge>
                      </div>
                    </CommandItem>
                  );
                })}
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  const renderSelectedAssignments = () => {
    if (selectedGroups.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {selectedGroups.map((group) => {
          const assignment = value.find((a) => a.groupId === group.id);

          return (
            <div
              key={group.id}
              className="flex items-center gap-2 p-2 border rounded-lg bg-muted/25"
            >
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{group.name}</div>
                <div className="text-xs text-muted-foreground">
                  {group.type} group
                </div>
              </div>

              {allowPositions && (
                <div className="flex items-center gap-2">
                  <Select
                    value={assignment?.position || 'Member'}
                    onValueChange={(position) =>
                      handlePositionChange(group.id, position)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(POSITION_GROUPS).map(
                        ([groupName, positions], groupIndex) => (
                          <div key={groupName}>
                            {groupIndex > 0 && <Separator className="my-2" />}
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                              {groupName}
                            </div>
                            {positions.map((position) => (
                              <SelectItem key={position} value={position}>
                                {position}
                              </SelectItem>
                            ))}
                          </div>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {onChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveAssignment(group.id)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Group Assignments</Label>
        {maxSelections && (
          <span className="text-xs text-muted-foreground">
            {value.length}/{maxSelections} selected
          </span>
        )}
      </div>

      {renderMultiselect()}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {renderSelectedAssignments()}
    </div>
  );
}
