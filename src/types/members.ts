// Member types for the membership management system

// Member interface matching the database schema
export interface Member {
  id: string;
  organization_id: string;
  branch_id: string | null;
  
  // Basic member information
  membership_id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null; // ISO date string
  gender: string | null;
  marital_status: string | null;
  
  // Address information
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  
  // Membership details
  membership_status: MembershipStatus;
  membership_type: MembershipType | null;
  date_joined: string | null; // ISO date string
  baptism_date: string | null; // ISO date string
  confirmation_date: string | null; // ISO date string
  
  // Emergency contact
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  
  // Additional form data from membership form schema
  custom_form_data: Record<string, any>;
  
  // Profile and preferences
  profile_image_url: string | null;
  notes: string | null;
  is_active: boolean;
  
  // Audit fields
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_updated_by: string | null;
}

// Member summary interface (from the database view)
export interface MemberSummary {
  id: string;
  organization_id: string;
  branch_id: string | null;
  membership_id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  membership_status: MembershipStatus;
  membership_type: MembershipType | null;
  date_joined: string | null;
  is_active: boolean;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
  age: number | null;
  membership_years: number | null;
  
  // Address fields (added in enhanced view)
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  
  // Branch information (added via JOIN)
  branch_name: string | null;
  branch_location: string | null;
  
  // Tag information (added in enhanced members_summary view)
  assigned_tags: string;
  tag_count: number;
  tags_with_categories: string;
}

// Membership status enum
export type MembershipStatus = 
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'transferred'
  | 'deceased';

// Membership type enum
export type MembershipType = 
  | 'Regular'
  | 'Associate'
  | 'New Convert'
  | 'Visitor';

// Gender options
export type Gender = 
  | 'male'
  | 'female'
  | 'other'
  | 'prefer_not_to_say';

// Marital status options
export type MaritalStatus = 
  | 'single'
  | 'married'
  | 'divorced'
  | 'widowed'
  | 'separated'
  | 'other';

// Member creation/update types
export interface CreateMemberData {
  organization_id: string;
  branch_id?: string;
  membership_id?: string; // Auto-generated if not provided
  first_name: string;
  last_name: string;
  middle_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  
  // Address information
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Membership details
  membership_status?: MembershipStatus;
  membership_type?: MembershipType;
  date_joined?: string;
  baptism_date?: string;
  confirmation_date?: string;
  
  // Emergency contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Additional form data
  custom_form_data?: Record<string, any>;
  
  // Profile and preferences
  profile_image_url?: string;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateMemberData extends Partial<Omit<CreateMemberData, 'organization_id'>> {
  id: string;
}

// Member filter and search types
export interface MemberFilters {
  search?: string;
  membership_status?: MembershipStatus | 'all';
  membership_type?: MembershipType | 'all';
  branch_id?: string | 'all';
  gender?: string | 'all';
  age_range?: {
    min?: number;
    max?: number;
  };
  date_joined_range?: {
    start?: string;
    end?: string;
  };
  is_active?: boolean | 'all';
  // Tag filtering options
  tag_items?: string[]; // Array of tag item IDs to filter by
  tag_filter_mode?: 'any' | 'all'; // Whether member should have ANY or ALL of the specified tags
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
}

// Member display preferences
export interface MemberDisplayPreferences {
  view_mode: 'table' | 'card';
  page_size: number;
  sort_field: string;
  sort_order: 'asc' | 'desc';
  show_inactive: boolean;
  columns_visible: {
    membership_id: boolean;
    name: boolean;
    email: boolean;
    phone: boolean;
    membership_status: boolean;
    membership_type: boolean;
    join_date: boolean;
    actions: boolean;
  };
}

// Member form field configuration (from membership form schema)
export interface MemberFormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Member statistics interface
export interface MemberStatistics {
  total_members: number;
  active_members: number;
  inactive_members: number;
  new_members_this_month: number;
  new_members_this_year: number;
  members_by_status: Record<MembershipStatus, number>;
  members_by_branch: Record<string, number>;
  members_by_age_group: Record<string, number>;
  members_by_gender: Record<string, number>;
}

// Member export/import types
export interface MemberExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters?: MemberFilters;
  include_form_data: boolean;
}

export interface MemberImportData {
  file: File;
  mapping: Record<string, string>; // CSV column to member field mapping
  skip_duplicates: boolean;
  update_existing: boolean;
}

// Member relationship types (for family management)
export interface MemberRelationship {
  id: string;
  member_id: string;
  related_member_id: string;
  relationship_type: RelationshipType;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export type RelationshipType = 
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'guardian'
  | 'other';

// Member with relationships
export interface MemberWithRelationships extends Member {
  relationships: (MemberRelationship & {
    related_member: MemberSummary;
  })[];
}

// Member print options
export interface MemberPrintOptions {
  type: 'profile' | 'membership_card' | 'directory';
  include_photo: boolean;
  include_contact_info: boolean;
  include_membership_details: boolean;
  include_form_data: boolean;
  template?: string;
}