import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounceValue } from '@/hooks/useDebounce';
import { useMemberSearch, type MemberSearchResult } from '@/hooks/useMemberSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Component props interface
export interface MemberSearchTypeaheadProps {
  organizationId: string;
  value?: MemberSearchResult[];
  onChange?: (members: MemberSearchResult[]) => void;
  placeholder?: string;
  multiSelect?: boolean;
  disabled?: boolean;
  className?: string;
  maxSelections?: number;
  includeInactive?: boolean;
  searchFields?: ('name' | 'email' | 'phone' | 'membershipId')[];
  emptyMessage?: string;
  loadingMessage?: string;
  branchId?: string; // Optional branch filtering - disabled by default for backward compatibility
  excludeMembers?: string[]; // Array of member IDs to exclude from search results
  allowedMemberIds?: string[]; // When provided, restrict results to only these member IDs
}

// Individual member item component
interface MemberItemProps {
  member: MemberSearchResult;
  isSelected: boolean;
  multiSelect: boolean;
  onSelect: (member: MemberSearchResult) => void;
  onDeselect: (member: MemberSearchResult) => void;
}

function MemberItem({ member, isSelected, multiSelect, onSelect, onDeselect }: MemberItemProps) {
  const handleClick = () => {
    if (isSelected) {
      onDeselect(member);
    } else {
      onSelect(member);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-colors rounded-md",
        "hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent/50"
      )}
      onClick={handleClick}
    >
      {multiSelect && (
        <Checkbox
          checked={isSelected}
          onChange={() => {}} // Handled by parent click
          className="pointer-events-none"
        />
      )}
      
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={member.profile_image_url || undefined} />
        <AvatarFallback className="text-xs">
          {getInitials(member.display_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {member.display_name}
        </div>
        {member.display_subtitle && (
          <div className="text-xs text-muted-foreground truncate">
            {member.display_subtitle}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!multiSelect && isSelected && (
          <Check className="h-4 w-4 text-primary" />
        )}
      </div>
    </div>
  );
}

// Selected member badge component
interface SelectedMemberBadgeProps {
  member: MemberSearchResult;
  onRemove: (member: MemberSearchResult) => void;
  disabled?: boolean;
}

function SelectedMemberBadge({ member, onRemove, disabled }: SelectedMemberBadgeProps) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1 mr-1 mb-1">
      <span className="truncate max-w-[120px]">
        {member.display_name}
      </span>
      {!disabled && (
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(member);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
}

// Main component
export function MemberSearchTypeahead({
  organizationId,
  value = [],
  onChange,
  placeholder = "Search members...",
  multiSelect = false,
  disabled = false,
  className,
  maxSelections,
  includeInactive = false,
  searchFields = ['name', 'email', 'phone', 'membershipId'],
  emptyMessage = "No members found",
  loadingMessage = "Searching members...",
  branchId, // Optional branch filtering
  excludeMembers = [], // Array of member IDs to exclude from search results
  allowedMemberIds = []
}: MemberSearchTypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the member search hook
  const {
    data: searchResults = [],
    isLoading,
    error
  } = useMemberSearch({
    organizationId,
    searchTerm: debouncedSearchTerm,
    limit: 10,
    includeInactive,
    searchFields,
    branchId // Pass branch filtering to the hook
  });

  // Handle member selection
  const handleSelect = (member: MemberSearchResult) => {
    if (disabled) return;

    let newValue: MemberSearchResult[];

    if (multiSelect) {
      // Check if already selected
      const isAlreadySelected = value.some(m => m.id === member.id);
      if (isAlreadySelected) return;

      // Check max selections
      if (maxSelections && value.length >= maxSelections) return;

      newValue = [...value, member];
    } else {
      newValue = [member];
      setIsOpen(false);
      setSearchTerm('');
      setInputValue('');
    }

    onChange?.(newValue);
  };

  // Handle member deselection
  const handleDeselect = (member: MemberSearchResult) => {
    if (disabled) return;

    const newValue = value.filter(m => m.id !== member.id);
    onChange?.(newValue);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // In single-select mode, if a member is selected, clear selection when user edits
    if (!multiSelect && value.length > 0) {
      onChange?.([]);
    }

    setInputValue(newValue);
    setSearchTerm(newValue);

    // Open dropdown when user types; close when input is cleared
    if (newValue.trim()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Handle input focus - no auto-opening
  const handleInputFocus = () => {
    // Only open if there's already text content
    if (!disabled && inputValue.trim()) {
      setIsOpen(true);
    }
  };

  // Handle clear all
  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    onChange?.([]);
    setSearchTerm('');
    setInputValue('');
    inputRef.current?.focus();
  };

  // Filter search results: first exclude listed members, then restrict to allowed set if provided
  const filteredResults = searchResults
    .filter(member => !excludeMembers.includes(member.id))
    .filter(member => (allowedMemberIds.length > 0 ? allowedMemberIds.includes(member.id) : true));

  // Check if member is selected
  const isSelected = (member: MemberSearchResult) => {
    return value.some(selected => selected.id === member.id);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get display value for single select mode
  const getDisplayValue = () => {
    if (!multiSelect) {
      // Prefer current typed text when present, otherwise show selected member name
      if (inputValue.trim()) return inputValue;
      if (value.length > 0) return value[0].display_name;
    }
    return inputValue;
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Selected members display for multi-select */}
      {multiSelect && value.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {value.map((member) => (
            <SelectedMemberBadge
              key={member.id}
              member={member}
              onRemove={handleDeselect}
              disabled={disabled}
            />
          ))}
        </div>
      )}
      
      {/* Main input field */}
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={getDisplayValue()}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "pr-20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        
        {/* Right side icons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value.length > 0 && !disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleClearAll}
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Search className="h-4 w-4 opacity-50" />
        </div>
      </div>

      {/* Custom Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-md">
          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {loadingMessage}
              </div>
            ) : error ? (
              <div className="p-4 text-center text-sm text-destructive">
                Error loading members
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {debouncedSearchTerm.trim() ? emptyMessage : "Start typing to search members"}
              </div>
            ) : (
              <div className="p-1">
                {filteredResults.map((member) => (
                  <MemberItem
                    key={member.id}
                    member={member}
                    isSelected={isSelected(member)}
                    multiSelect={multiSelect}
                    onSelect={handleSelect}
                    onDeselect={handleDeselect}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {multiSelect && value.length > 0 && (
            <div className="border-t p-2 text-xs text-muted-foreground text-center">
              {value.length} selected
              {maxSelections && ` of ${maxSelections} max`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}