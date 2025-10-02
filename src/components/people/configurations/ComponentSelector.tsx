import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Type,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  CheckSquare,
  Circle,
  FileText,
  Hash,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormComponentType } from '@/types/people-configurations';

interface ComponentOption {
  type: FormComponentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const COMPONENT_OPTIONS: ComponentOption[] = [
  {
    type: 'text',
    label: 'Text Input',
    icon: Type,
    description: 'Single line text field',
  },
  {
    type: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Email address field',
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: Phone,
    description: 'Phone number field',
  },
  {
    type: 'date',
    label: 'Date',
    icon: Calendar,
    description: 'Date picker field',
  },
  {
    type: 'select',
    label: 'Select',
    icon: ChevronDown,
    description: 'Dropdown selection',
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    description: 'Multiple choice options',
  },
  {
    type: 'radio',
    label: 'Radio',
    icon: Circle,
    description: 'Single choice options',
  },
  {
    type: 'textarea',
    label: 'Textarea',
    icon: FileText,
    description: 'Multi-line text field',
  },
  {
    type: 'number',
    label: 'Number',
    icon: Hash,
    description: 'Numeric input field',
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: Upload,
    description: 'File upload field',
  },
];

interface ComponentSelectorProps {
  onSelect: (componentType: FormComponentType) => void;
  disabled?: boolean;
  className?: string;
}

export function ComponentSelector({
  onSelect,
  disabled = false,
  className,
}: ComponentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = COMPONENT_OPTIONS.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (componentType: FormComponentType) => {
    onSelect(componentType);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full justify-start gap-2 h-auto py-3 px-4',
          'border-2 border-dashed border-muted-foreground/25',
          'hover:border-primary/50 hover:bg-accent/50',
          'text-muted-foreground hover:text-foreground',
          'transition-all duration-200',
          isOpen && 'border-primary bg-accent'
        )}
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm">Add component</span>
      </Button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 right-0 z-50 mt-1',
            'bg-background border border-border rounded-lg shadow-lg',
            'max-h-80 overflow-hidden'
          )}
        >
          {/* Search Header */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No components found
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.type}
                      onClick={() => handleSelect(option.type)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-md',
                        'hover:bg-accent hover:text-accent-foreground',
                        'transition-colors duration-150',
                        'text-left'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-md flex items-center justify-center',
                          'bg-primary/10 text-primary flex-shrink-0'
                        )}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {option.label}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
