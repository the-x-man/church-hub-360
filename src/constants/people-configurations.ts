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

// Component style options
export const componentStyleOptions: {
  value: ComponentStyle;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}[] = [
  {
    value: 'dropdown',
    label: 'Dropdown',
    description: 'Single selection dropdown',
    icon: ChevronDown,
  },
  {
    value: 'multiselect',
    label: 'Multi-select',
    description: 'Multiple selection dropdown',
    icon: CheckSquare,
  },
  {
    value: 'checkbox',
    label: 'Checkboxes',
    description: 'Multiple checkboxes',
    icon: Square,
  },
  {
    value: 'radio',
    label: 'Radio buttons',
    description: 'Single selection radio buttons',
    icon: Circle,
  },
  { 
    value: 'list', 
    label: 'List', 
    description: 'Simple list display',
    icon: List,
  },
];