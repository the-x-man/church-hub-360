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
  | 'list'
  | 'badge';

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

// Interface for tag categories with id (for component usage)
export interface TagCategoryWithId extends TagCategory {
  id: string;
}

// Tags schema structure
export interface TagsSchema {
  categories: {
    [categoryKey: string]: TagCategory;
  };
}

// Position interface for committee roles
export interface CommitteePosition {
  id: string;
  name: string;
  description?: string;
  display_order?: number;
}

// Committees schema structure (for future use)
export interface CommitteesSchema {
  committees: {
    [committeeKey: string]: {
      name: string;
      description: string;
      members: string[];
      positions: CommitteePosition[];
      is_active: boolean;
      created_date: string;
      end_date?: string;
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

// Committee form data types
export interface CommitteeFormData {
  name: string;
  description: string;
  is_active: boolean;
  end_date?: string;
}

// Committee interface for local state management
export interface Committee {
  name: string;
  description: string;
  members: string[];
  positions: CommitteePosition[];
  is_active: boolean;
  created_date: string;
  end_date?: string;
}

// Utility types for tag management
export interface TagCategoryWithKey extends TagCategory {
  id: string;
  key: string;
  tag_items?: TagItemWithKey[];
}

export interface TagItemWithKey extends TagItem {
  key: string;
  categoryKey: string;
}

// Membership Form Builder Types
export type ColumnLayout = 1 | 2 | 3;

export interface FormColumn {
  id: string;
  component: FormComponent | null;
}

export interface FormRow {
  id: string;
  layout: ColumnLayout;
  columns: FormColumn[];
}

export interface FormComponent {
  id: string;
  type: FormComponentType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select, radio, checkbox
  validation?: FormValidation;
  tagReference?: string; // For tag-based components
  dateFormat?: string; // For date picker format (e.g., 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd')
  fileSettings?: FilePickerSettings; // For file picker configuration
}

export type FormComponentType = 
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file';

export interface FormValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface FilePickerSettings {
  acceptedFileTypes?: string[]; // MIME types or file extensions (e.g., ['image/*', '.pdf', '.doc'])
  maxFileSize?: number; // Maximum file size in MB (max 10MB)
  dropzoneText?: string; // Custom placeholder text for the dropzone
}

export interface MembershipFormSchema {
  id: string;
  name: string;
  description?: string;
  rows: FormRow[];
  is_active: boolean;
  created_date: string;
  updated_date?: string;
}

export interface MembershipFormData {
  name: string;
  description?: string;
  is_active: boolean;
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
  updateTagsSchema: (newTagsSchema: TagsSchema, skipOptimistic?: boolean) => Promise<void>;
  createCategory: (categoryKey: string, category: TagCategoryFormData) => Promise<void>;
  updateCategory: (categoryKey: string, category: Partial<TagCategoryFormData>) => Promise<void>;
  deleteCategory: (categoryKey: string) => Promise<void>;
  createTagItem: (categoryKey: string, item: TagItemFormData) => Promise<void>;
  updateTagItem: (categoryKey: string, itemId: string, item: Partial<TagItemFormData>) => Promise<void>;
  deleteTagItem: (categoryKey: string, itemId: string) => Promise<void>;
  reorderCategories: (categoryKeys: string[]) => Promise<void>;
  reorderTagItems: (categoryKey: string, itemIds: string[]) => Promise<void>;
}

export interface UseCommitteesManagementReturn {
  committeesSchema: CommitteesSchema | null;
  loading: boolean;
  operationLoading: boolean;
  error: string | null;
  updateCommitteesSchema: (newCommitteesSchema: CommitteesSchema, skipOptimistic?: boolean) => Promise<void>;
  createCommittee: (committeeKey: string, committee: CommitteeFormData) => Promise<void>;
  updateCommittee: (committeeKey: string, committee: Partial<CommitteeFormData>) => Promise<void>;
  deleteCommittee: (committeeKey: string) => Promise<void>;
  addMember: (committeeKey: string, memberId: string) => Promise<void>;
  removeMember: (committeeKey: string, memberId: string) => Promise<void>;
}

export interface UseMembershipFormManagementReturn {
  membershipFormSchema: MembershipFormSchema | null;
  loading: boolean;
  operationLoading: boolean;
  error: string | null;
  updateMembershipFormSchema: (newMembershipFormSchema: MembershipFormSchema, skipOptimistic?: boolean) => Promise<void>;
  saveMembershipForm: (formData: MembershipFormData) => Promise<void>;
  updateFormMetadata: (metadata: Partial<MembershipFormData>) => Promise<void>;
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