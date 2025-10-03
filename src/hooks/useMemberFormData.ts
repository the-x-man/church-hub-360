import { useMemo } from 'react';
import type { 
  FormComponent, 
  TagCategoryWithId
} from '@/types/people-configurations';
import type { CreateMemberData } from '@/types/members';
import { createMemberFormSchema, type MemberFormData } from '@/schemas/memberFormSchema';

export interface UseMemberFormDataProps {
  customFields?: FormComponent[];
  tagCategories?: TagCategoryWithId[];
  initialData?: Partial<MemberFormData>;
  initialCustomFields?: Record<string, any>;
  initialTags?: Record<string, any>;
}

export const useMemberFormData = ({
  customFields = [],
  tagCategories = [],
  initialData = {},
  initialCustomFields = {},
  initialTags = {},
}: UseMemberFormDataProps) => {
  
  // Create dynamic schema based on custom fields and tag categories
  const schema = useMemo(() => {
    return createMemberFormSchema(customFields, tagCategories);
  }, [customFields, tagCategories]);

  // Transform initial data to match form schema
  const defaultValues = useMemo(() => {
    const transformedCustomFields: Record<string, any> = {};
    customFields.forEach((field) => {
      const fieldKey = `custom_${field.id}`;
      transformedCustomFields[fieldKey] = initialCustomFields[field.id] || getDefaultValueForField(field);
    });

    const transformedTags: Record<string, any> = {};
    tagCategories.forEach((category) => {
      const fieldKey = `tag_${category.id}`;
      transformedTags[fieldKey] = initialTags[category.id] || getDefaultValueForTag(category);
    });

    return {
      // Default membership form data
      first_name: initialData.first_name || '',
      middle_name: initialData.middle_name || '',
      last_name: initialData.last_name || '',
      date_of_birth: initialData.date_of_birth || '',
      gender: initialData.gender || '',
      marital_status: initialData.marital_status || '',
      phone: initialData.phone || '',
      email: initialData.email || '',
      address_line_1: initialData.address_line_1 || '',
      address_line_2: initialData.address_line_2 || '',
      city: initialData.city || '',
      state: initialData.state || '',
      postal_code: initialData.postal_code || '',
      country: initialData.country || '',
      membership_id: initialData.membership_id || '',
      date_joined: initialData.date_joined || undefined,
      baptism_date: initialData.baptism_date || undefined,
      notes: initialData.notes || '',
      profile_image_url: initialData.profile_image_url || '',
      branch_id: initialData.branch_id || '',
      
      // Custom fields
      custom_fields: transformedCustomFields,
      
      // Tags
      tags: transformedTags,
    } as MemberFormData;
  }, [initialData, customFields, tagCategories, initialCustomFields, initialTags]);

  // Transform form data back to API format
  const transformToApiData = (formData: MemberFormData): Omit<CreateMemberData, 'organization_id'> => {
    // Extract default membership data
    const {
      custom_fields,
      tags,
      date_joined,
      baptism_date,
      ...defaultMembershipData
    } = formData;

    // Transform custom fields back to original format
    const transformedCustomFields: Record<string, any> = {};
    if (custom_fields) {
      Object.entries(custom_fields).forEach(([key, value]) => {
        if (key.startsWith('custom_')) {
          const fieldId = key.replace('custom_', '');
          transformedCustomFields[fieldId] = value;
        }
      });
    }

    // Transform tags back to original format
    const transformedTags: Record<string, any> = {};
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        if (key.startsWith('tag_')) {
          const categoryId = key.replace('tag_', '');
          transformedTags[categoryId] = value;
        }
      });
    }

    return {
      ...defaultMembershipData,
      date_joined: date_joined ? date_joined.toString() : undefined,
      baptism_date: baptism_date ? baptism_date.toString() : undefined,
      form_data: {
        custom_fields: transformedCustomFields,
        tags: transformedTags,
      },
    };
  };

  // Extract data for individual form components
  const getDefaultMembershipData = (formData: MemberFormData): Omit<MemberFormData, 'custom_fields' | 'tags'> => {
    const {
      custom_fields,
      tags,
      ...defaultData
    } = formData;

    return defaultData;
  };

  const getCustomFieldsData = (formData: MemberFormData): Record<string, any> => {
    const customFieldsData: Record<string, any> = {};
    
    if (formData.custom_fields) {
      Object.entries(formData.custom_fields).forEach(([key, value]) => {
        if (key.startsWith('custom_')) {
          const fieldId = key.replace('custom_', '');
          customFieldsData[fieldId] = value;
        }
      });
    }
    
    return customFieldsData;
  };

  const getTagsData = (formData: MemberFormData): Record<string, any> => {
    const tagsData: Record<string, any> = {};
    
    if (formData.tags) {
      Object.entries(formData.tags).forEach(([key, value]) => {
        if (key.startsWith('tag_')) {
          const categoryId = key.replace('tag_', '');
          tagsData[categoryId] = value;
        }
      });
    }
    
    return tagsData;
  };

  return {
    schema,
    defaultValues,
    transformToApiData,
    getDefaultMembershipData,
    getCustomFieldsData,
    getTagsData,
  };
};

// Helper functions for default values
function getDefaultValueForField(field: FormComponent): any {
  switch (field.type) {
    case 'checkbox':
      return [];
    case 'number':
      return field.validation?.min || 0;
    case 'date':
      return '';
    case 'file':
      return null;
    default:
      return '';
  }
}

function getDefaultValueForTag(category: TagCategoryWithId): any {
  switch (category.component_style) {
    case 'multiselect':
    case 'checkbox':
    case 'list':
      return [];
    default:
      return '';
  }
}