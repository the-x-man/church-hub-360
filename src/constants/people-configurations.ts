import {
  Users,
  UserCheck,
  Shield,
  Briefcase,
  Heart,
  Building,
  ChevronDown,
  CheckSquare,
  Circle,
  List,
  Square,
} from 'lucide-react';
import type { ComponentStyle } from '../types/people-configurations';

// Tag icons mapping
export const tagIcons: Record<string, React.ComponentType<any>> = {
  membership_categories: Users,
  membership_status: UserCheck,
  leadership_levels: Shield,
  positions: Briefcase,
  ministries: Heart,
  departments: Building,
  groups: Users,
};

// Component style options grouped by selection type
export const componentStyleOptions: {
  value: ComponentStyle;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  group: 'single' | 'multiple';
}[] = [
  // Single Selection Options
  {
    value: 'dropdown',
    label: 'Dropdown (Single)',
    description: 'Choose one option from a dropdown menu',
    icon: ChevronDown,
    group: 'single',
  },
  {
    value: 'radio',
    label: 'Radio Buttons',
    description: 'Choose one option from visible radio buttons',
    icon: Circle,
    group: 'single',
  },
  // Multiple Selection Options
  {
    value: 'multiselect',
    label: 'Multi-select Dropdown',
    description: 'Choose multiple options from a dropdown',
    icon: CheckSquare,
    group: 'multiple',
  },
  {
    value: 'checkbox',
    label: 'Checkboxes',
    description: 'Choose multiple options with checkboxes',
    icon: Square,
    group: 'multiple',
  },
  // Display Only
  { 
    value: 'list', 
    label: 'List Display',
    description: 'Simple list for display purposes only',
    icon: List,
    group: 'single',
  },
];