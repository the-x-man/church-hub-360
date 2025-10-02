import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Type,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  CheckSquare,
  Circle,
  FileText,
  Hash,
  Tag,
  Upload,
} from 'lucide-react';
import type { FormComponentType } from '@/types/people-configurations';

interface ComponentTypeSelectorProps {
  value: FormComponentType;
  onValueChange: (value: FormComponentType) => void;
}

const COMPONENT_TYPES = [
  {
    type: 'text' as FormComponentType,
    label: 'Text Input',
    icon: Type,
  },
  {
    type: 'email' as FormComponentType,
    label: 'Email',
    icon: Mail,
  },
  {
    type: 'phone' as FormComponentType,
    label: 'Phone',
    icon: Phone,
  },
  {
    type: 'date' as FormComponentType,
    label: 'Date',
    icon: Calendar,
  },
  {
    type: 'select' as FormComponentType,
    label: 'Select',
    icon: ChevronDown,
  },
  {
    type: 'checkbox' as FormComponentType,
    label: 'Checkbox',
    icon: CheckSquare,
  },
  {
    type: 'radio' as FormComponentType,
    label: 'Radio',
    icon: Circle,
  },
  {
    type: 'textarea' as FormComponentType,
    label: 'Textarea',
    icon: FileText,
  },
  {
    type: 'number' as FormComponentType,
    label: 'Number',
    icon: Hash,
  },
  {
    type: 'file' as FormComponentType,
    label: 'File Upload',
    icon: Upload,
  },
  {
    type: 'tag' as FormComponentType,
    label: 'Tag',
    icon: Tag,
  },
];

export function ComponentTypeSelector({ value, onValueChange }: ComponentTypeSelectorProps) {
  const selectedComponent = COMPONENT_TYPES.find(comp => comp.type === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px] h-8 text-xs">
        <SelectValue placeholder="Select field type">
          {selectedComponent && (
            <div className="flex items-center gap-2">
              <selectedComponent.icon className="h-3 w-3" />
              <span>{selectedComponent.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {COMPONENT_TYPES.map((component) => {
          const Icon = component.icon;
          return (
            <SelectItem key={component.type} value={component.type}>
              <div className="flex items-center gap-2">
                <Icon className="h-3 w-3" />
                <span>{component.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}