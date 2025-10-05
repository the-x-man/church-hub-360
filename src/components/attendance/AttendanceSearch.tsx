/**
 * AttendanceSearch Component
 * Adaptive search interface for finding members to mark attendance
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Phone, Mail, Hash, X, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { cn } from '@/lib/utils';
import { useAttendanceMemberSearch } from '@/hooks/useMemberQueries';
import type {
  AttendanceMarkingMode,
  AttendanceMemberResult,
} from '@/types/attendance';


interface AttendanceSearchProps {
  organizationId: string;
  enabledModes: AttendanceMarkingMode[];
  onMemberSelect: (member: AttendanceMemberResult) => void;
  placeholder?: string;
  className?: string;
}

const modeConfig = {
  phone: {
    icon: Phone,
    label: 'Phone',
    placeholder: 'Search by phone number...',
    pattern: /^[\d\s\-\+\(\)]+$/,
  },
  email: {
    icon: Mail,
    label: 'Email',
    placeholder: 'Search by email address...',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  membershipId: {
    icon: Hash,
    label: 'ID',
    placeholder: 'Search by membership ID...',
    pattern: /^[a-zA-Z0-9\-_]+$/,
  },
};

export function AttendanceSearch({
  organizationId,
  enabledModes,
  onMemberSelect,
  placeholder,
  className,
}: AttendanceSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<AttendanceMarkingMode>(
    enabledModes[0] || 'phone'
  );
  
  // Use the Supabase-based search hook
  const { data: filteredMembers = [], isLoading, error } = useAttendanceMemberSearch(
    organizationId,
    searchTerm,
    searchMode
  );

  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Open/close dropdown based on search term and results
  useEffect(() => {
    setIsOpen(searchTerm.length > 0);
    setSelectedIndex(-1);
  }, [searchTerm, filteredMembers]);

  // Handle search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Clear search
  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle member selection
  const handleMemberSelect = (member: AttendanceMemberResult) => {
    onMemberSelect(member);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredMembers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredMembers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredMembers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredMembers.length) {
          handleMemberSelect(filteredMembers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex]);

  // Get current mode configuration
  const currentModeConfig = modeConfig[searchMode];
  const currentPlaceholder =
    placeholder || currentModeConfig?.placeholder || 'Search members...';

  // Determine if we should show mode selector
  const showModeSelector = enabledModes.length > 1;

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-2">
        {/* Mode Selector (if multiple modes enabled) */}
        {showModeSelector && (
          <Select
            value={searchMode}
            onValueChange={(value) =>
              setSearchMode(value as AttendanceMarkingMode)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {currentModeConfig?.icon && (
                    <currentModeConfig.icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {currentModeConfig?.label}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {enabledModes.map((mode) => {
                const config = modeConfig[mode];
                return (
                  <SelectItem key={mode} value={mode}>
                    <div className="flex items-center gap-2">
                      <config.icon className="h-4 w-4" />
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}

        {/* Search Input */}
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={currentPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10"
              autoComplete="off"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isOpen && searchTerm && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg">
              <div ref={listRef} className="max-h-64 overflow-y-auto p-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <div className="text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-sm">Searching members...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Error searching members</p>
                      <p className="text-xs">Please try again</p>
                    </div>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No members found</p>
                      <p className="text-xs">Try adjusting your search term</p>
                    </div>
                  </div>
                ) : (
                  filteredMembers.map((member, index) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberSelect(member)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        selectedIndex === index &&
                          'bg-accent text-accent-foreground'
                      )}
                    >
                      {/* Member Avatar */}
                      <div className="flex-shrink-0">
                        {member.profile_image_url ? (
                          <img
                            src={member.profile_image_url}
                            alt={member.full_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium text-muted-foreground">
                              {member.full_name
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Member Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {member.full_name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {member.membership_id}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {member.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{member.email}</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {/* {member.tags && member.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {member.tags.slice(0, 3).map((tag: any) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {member.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{member.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )} */}
                      </div>

                      {/* Search Mode Indicator */}
                      {showModeSelector && (
                        <div className="flex-shrink-0">
                          <currentModeConfig.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Tips */}
      {enabledModes.length > 1 && !searchTerm && (
        <div className="mt-2 text-xs text-muted-foreground">
          <p>
            Search by:{' '}
            {enabledModes.map((mode) => modeConfig[mode].label).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
