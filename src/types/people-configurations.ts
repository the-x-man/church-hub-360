/**
 * People Configuration Types
 * Defines types for church member tags, categories, and configuration schemas
 */

// Component style options for form rendering
export type ComponentStyle = 
  | 'dropdown' 
  | 'multiselect' 
  | 'checkbox' 
  | 'radio' 
  | 'list';

// Base interface for tag items
export interface TagItem {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  display_order?: number;
}

// Interface for tag categories
export interface TagCategory {
  name: string;
  description?: string;
  display_order?: number;
  is_required: boolean;
  component_style: ComponentStyle;
  is_active: boolean;
  items: TagItem[];
}

// Tags schema structure
export interface TagsSchema {
  categories: {
    [categoryKey: string]: TagCategory;
  };
}

// Committees schema structure (for future use)
export interface CommitteesSchema {
  committees: {
    [committeeKey: string]: {
      name: string;
      description: string;
      members: string[];
      chair_person?: string;
      is_active: boolean;
      created_date: string;
      end_date?: string;
    };
  };
}

// Membership form schema structure (for future use)
export interface MembershipFormSchema {
  fields: {
    [fieldKey: string]: {
      label: string;
      type: 'text' | 'email' | 'phone' | 'date' | 'select' | 'multiselect' | 'textarea';
      required: boolean;
      placeholder?: string;
      options?: string[];
      validation?: {
        min_length?: number;
        max_length?: number;
        pattern?: string;
      };
      display_order: number;
      is_active: boolean;
    };
  };
}

// Main people configurations database record
export interface PeopleConfiguration {
  id: string;
  organization_id: string;
  tags_schema?: TagsSchema;
  committees_schema?: CommitteesSchema;
  membership_form_schema?: MembershipFormSchema;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_updated_by?: string;
}

// API request/response types
export interface CreatePeopleConfigurationRequest {
  organization_id: string;
  tags_schema?: TagsSchema;
  committees_schema?: CommitteesSchema;
  membership_form_schema?: MembershipFormSchema;
}

export interface UpdatePeopleConfigurationRequest {
  tags_schema?: TagsSchema;
  committees_schema?: CommitteesSchema;
  membership_form_schema?: MembershipFormSchema;
}

// Form data types for UI components
export interface TagCategoryFormData {
  name: string;
  description?: string;
  is_required: boolean;
  component_style: ComponentStyle;
  is_active: boolean;
}

export interface TagItemFormData {
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
}

// Utility types for tag management
export interface TagCategoryWithKey extends TagCategory {
  key: string;
}

export interface TagItemWithKey extends TagItem {
  categoryKey: string;
}

// Default tag categories for easy reference
export const DefaultTagCategories = {
  MEMBERSHIP_CATEGORIES: 'membership_categories',
  MEMBERSHIP_STATUS: 'membership_status',
  LEADERSHIP_LEVELS: 'leadership_levels',
  POSITIONS: 'positions',
  MINISTRIES: 'ministries',
  DEPARTMENTS: 'departments',
  GROUPS: 'groups',
} as const;

// Hook return types
export interface UsePeopleConfigurationReturn {
  configuration: PeopleConfiguration | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTagsManagementReturn {
  tagsSchema: TagsSchema | null;
  loading: boolean;
  operationLoading: boolean;
  error: string | null;
  createCategory: (categoryKey: string, category: TagCategoryFormData) => Promise<void>;
  updateCategory: (categoryKey: string, category: Partial<TagCategoryFormData>) => Promise<void>;
  deleteCategory: (categoryKey: string) => Promise<void>;
  createTagItem: (categoryKey: string, item: TagItemFormData) => Promise<void>;
  updateTagItem: (categoryKey: string, itemId: string, item: Partial<TagItemFormData>) => Promise<void>;
  deleteTagItem: (categoryKey: string, itemId: string) => Promise<void>;
  reorderCategories: (categoryKeys: string[]) => Promise<void>;
  reorderTagItems: (categoryKey: string, itemIds: string[]) => Promise<void>;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface TagValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Export utility functions types
export type TagCategoryValidator = (category: TagCategoryFormData) => TagValidationResult;
export type TagItemValidator = (item: TagItemFormData) => TagValidationResult;