/**
 * OccasionSelector Component
 * Dropdown selector for choosing occasions and dates with inline creation option
 */

import { useState } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  CalendarDays,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useOccasions } from '@/hooks/useAttendance';
import type { Occasion } from '@/types/attendance';
import { CreateOccasionModal } from './CreateOccasionModal';

interface OccasionSelectorProps {
  organizationId: string;
  selectedOccasionId?: string;
  selectedDate?: Date;
  onOccasionChange: (occasionId: string) => void;
  onDateChange: (date: Date) => void;
  className?: string;
  showCreateOption?: boolean;
  compact?: boolean;
}

export function OccasionSelector({
  organizationId,
  selectedOccasionId,
  selectedDate = new Date(),
  onOccasionChange,
  onDateChange,
  className,
  showCreateOption = true,
  compact = false,
}: OccasionSelectorProps) {
  const { occasions, activeOccasions } = useOccasions(organizationId);
  const [occasionOpen, setOccasionOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const selectedOccasion = occasions.find((o) => o.id === selectedOccasionId);

  const handleOccasionSelect = (occasionId: string) => {
    onOccasionChange(occasionId);
    setOccasionOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setDateOpen(false);
    }
  };

  const handleCreateOccasion = (occasion: Occasion) => {
    onOccasionChange(occasion.id);
    setShowCreateModal(false);
  };

  const getOccasionTypeColor = (type: string) => {
    const colors = {
      sunday_service:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      youth_meeting:
        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      special_event:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      retreat:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      wedding:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      funeral: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  if (compact) {
    return (
      <div className={cn('flex gap-2', className)}>
        {/* Compact Occasion Selector */}
        <Select value={selectedOccasionId} onValueChange={handleOccasionSelect}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select occasion">
              {selectedOccasion && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="truncate">{selectedOccasion.name}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {activeOccasions.map((occasion) => (
              <SelectItem key={occasion.id} value={occasion.id}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{occasion.name}</span>
                  {occasion.is_recurring && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Recurring
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
            {showCreateOption && (
              <SelectItem
                value="__create__"
                onSelect={() => setShowCreateModal(true)}
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plus className="h-4 w-4" />
                  <span>Create new occasion</span>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {/* Compact Date Selector */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-36 justify-start text-left font-normal"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {format(selectedDate, 'MMM dd, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {showCreateOption && (
          <CreateOccasionModal
            organizationId={organizationId}
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onOccasionCreated={handleCreateOccasion}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Occasion Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Occasion</label>
        <Popover open={occasionOpen} onOpenChange={setOccasionOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={occasionOpen}
              className="w-full justify-between"
            >
              {selectedOccasion ? (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{selectedOccasion.name}</span>
                  {selectedOccasion.is_recurring && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Recurring
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      getOccasionTypeColor(selectedOccasion.type)
                    )}
                  >
                    {selectedOccasion.type}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Select an occasion...</span>
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search occasions..." />
              <CommandList>
                <CommandEmpty>No occasions found.</CommandEmpty>
                <CommandGroup>
                  {activeOccasions.map((occasion) => (
                    <CommandItem
                      key={occasion.id}
                      value={occasion.id}
                      onSelect={() => handleOccasionSelect(occasion.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Calendar className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span>{occasion.name}</span>
                            {occasion.is_recurring && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Recurring
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Check
                        className={cn(
                          'ml-auto h-4 w-4',
                          selectedOccasionId === occasion.id
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                  {showCreateOption && (
                    <CommandItem
                      value="__create__"
                      onSelect={() => {
                        setOccasionOpen(false);
                        setShowCreateModal(true);
                      }}
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Plus className="h-4 w-4" />
                        <span>Create new occasion</span>
                      </div>
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Date Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {showCreateOption && (
        <CreateOccasionModal
          organizationId={organizationId}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onOccasionCreated={handleCreateOccasion}
        />
      )}
    </div>
  );
}
