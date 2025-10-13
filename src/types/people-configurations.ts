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

// Component style groups for UI organization
export type ComponentStyleGroup = 'single_select' | 'multi_select';

// Mapping of component styles to their groups
export const COMPONENT_STYLE_GROUPS: Record<ComponentStyle, ComponentStyleGroup> = {
  dropdown: 'single_select',
  radio: 'single_select',
  list: 'single_select',
  multiselect: 'multi_select',
  checkbox: 'multi_select',
  badge: 'multi_select',
} as const;

// New relational database types

// Tags table type (replaces TagCategory)
export interface Tag {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  display_order?: number;
  is_required: boolean;
  component_style: ComponentStyle;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tag items table type (replaces TagItem)
export interface TagItem {
  id: string;
  tag_id: string;
  label: string;
  description?: string;
  color: string;
  display_order?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Member tag items junction table type
export interface MemberTagItem {
  id: string;
  member_id: string;
  tag_item_id: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relationships for UI usage
export interface TagWithItems extends Tag {
  tag_items: TagItem[];
}

export interface TagItemWithTag extends TagItem {
  tag: Tag;
}




// Position interface for committee roles
export interface CommitteePosition {
  id: string;
  name: string;
  description?: string;
  display_order?: number;
}



// Main people configurations database record
export interface PeopleConfiguration {
  id: string;
  organization_id: string;
  membership_form_schema?: MembershipFormSchema;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_updated_by?: string;
}

// API request/response types for relational tags
export interface CreateTagRequest {
  organization_id: string;
  name: string;
  description?: string;
  is_required: boolean;
  component_style: ComponentStyle;
  is_active: boolean;
  display_order?: number;
}

export interface UpdateTagRequest {
  name?: string;
  description?: string;
  is_required?: boolean;
  component_style?: ComponentStyle;
  is_active?: boolean;
  display_order?: number;
}

export interface CreateTagItemRequest {
  tag_id: string;
  label: string;
  description?: string;
  color: string;
  is_active: boolean;
  display_order?: number;
}

export interface UpdateTagItemRequest {
  label?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface CreateMemberTagItemRequest {
  member_id: string;
  tag_item_id: string;
}
export interface CreatePeopleConfigurationRequest {
  organization_id: string;
  membership_form_schema?: MembershipFormSchema;
}

export interface UpdatePeopleConfigurationRequest {
  membership_form_schema?: MembershipFormSchema;
}

// Tag form data types

// Utility types for tag management
export interface TagWithKey extends Tag {
  key: string;
  tag_items?: TagItemWithKey[];
}

export interface TagItemWithKey extends TagItem {
  key: string;
  tag_id: string;
}

// Tag utility types
export interface TagWithKey extends Tag {
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

// Legacy types for backward compatibility with existing components
// TODO: Remove these once all components are updated to use relational types
export interface TagSchema {
  id: string;
  name: string;
  description?: string;
  is_required: boolean;
  component_style: ComponentStyle;
  is_active: boolean;
  display_order?: number;
  items: TagItemSchema[];
}

export interface TagItemSchema {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  display_order?: number;
}