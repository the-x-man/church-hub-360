import { z } from 'zod';
import type { FormComponent, TagWithKey } from '@/types/people-configurations';

// Base schema for default membership form fields
export const defaultMembershipSchema = z.object({
  // Personal Information
  first_name: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  middle_name: z.string().max(50, 'Middle name must be less than 50 characters').optional(),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  date_of_birth: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime()) && date <= new Date();
  }, 'Please enter a valid date of birth'),
  gender: z.string().min(1, 'Gender is required'),
  marital_status: z.string().min(1, 'Marital status is required'),
  
  // Contact Information
  phone: z.string().min(1, 'Phone number is required').regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  
  // Address Information
  address_line_1: z.string().min(1, 'Address line 1 is required').max(100, 'Address line 1 must be less than 100 characters'),
  address_line_2: z.string().max(100, 'Address line 2 must be less than 100 characters').optional(),
  city: z.string().min(1, 'City is required').max(50, 'City must be less than 50 characters'),
  state: z.string().min(1, 'State is required').max(50, 'State must be less than 50 characters'),
  postal_code: z.string().min(1, 'Postal code is required').max(20, 'Postal code must be less than 20 characters'),
  country: z.string().min(1, 'Country is required').max(50, 'Country must be less than 50 characters'),
  
  // Membership Information
  membership_id: z.string().optional(),
  date_joined: z.date().optional().refine((val) => {
    if (!val) return true;
    return val <= new Date();
  }, 'Date joined cannot be in the future'),
  baptism_date: z.date().optional().refine((val) => {
    if (!val) return true;
    return val <= new Date();
  }, 'Baptism date cannot be in the future'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  profile_image_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  
  // Branch selection
  branch_id: z.string().min(1, 'Please select a branch'),
});

// Dynamic field validation based on FormComponent type
export const createDynamicFieldSchema = (component: FormComponent) => {
  const baseSchema = component.required 
    ? z.any().refine((val) => val !== undefined && val !== null && val !== '', `${component.label} is required`)
    : z.any().optional();

  switch (component.type) {
    case 'text':
      return component.required
        ? z.string().min(1, `${component.label} is required`)
            .min(component.validation?.minLength || 0, `${component.label} must be at least ${component.validation?.minLength} characters`)
            .max(component.validation?.maxLength || 1000, `${component.label} must be less than ${component.validation?.maxLength} characters`)
        : z.string()
            .max(component.validation?.maxLength || 1000, `${component.label} must be less than ${component.validation?.maxLength} characters`)
            .optional();

    case 'email':
      return component.required
        ? z.string().min(1, `${component.label} is required`).email(`Please enter a valid ${component.label.toLowerCase()}`)
        : z.string().email(`Please enter a valid ${component.label.toLowerCase()}`).optional().or(z.literal(''));

    case 'phone':
      return component.required
        ? z.string().min(1, `${component.label} is required`).regex(/^[\+]?[1-9][\d]{0,15}$/, `Please enter a valid ${component.label.toLowerCase()}`)
        : z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, `Please enter a valid ${component.label.toLowerCase()}`).optional().or(z.literal(''));

    case 'number':
      const numberSchema = z.number({
        message: `${component.label} must be a number`,
      });
      
      let validatedNumberSchema = numberSchema;
      if (component.validation?.min !== undefined) {
        validatedNumberSchema = validatedNumberSchema.min(component.validation.min, `${component.label} must be at least ${component.validation.min}`);
      }
      if (component.validation?.max !== undefined) {
        validatedNumberSchema = validatedNumberSchema.max(component.validation.max, `${component.label} must be at most ${component.validation.max}`);
      }
      
      return component.required ? validatedNumberSchema : validatedNumberSchema.optional();

    case 'date':
      return component.required
        ? z.string().min(1, `${component.label} is required`).refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
          }, `Please enter a valid ${component.label.toLowerCase()}`)
        : z.string().refine((val) => {
            if (!val) return true;
            const date = new Date(val);
            return !isNaN(date.getTime());
          }, `Please enter a valid ${component.label.toLowerCase()}`).optional();

    case 'textarea':
      return component.required
        ? z.string().min(1, `${component.label} is required`)
            .min(component.validation?.minLength || 0, `${component.label} must be at least ${component.validation?.minLength} characters`)
            .max(component.validation?.maxLength || 2000, `${component.label} must be less than ${component.validation?.maxLength} characters`)
        : z.string()
            .max(component.validation?.maxLength || 2000, `${component.label} must be less than ${component.validation?.maxLength} characters`)
            .optional();

    case 'select':
    case 'radio':
      const options = component.options || [];
      if (options.length === 0) {
        return z.string().optional();
      }
      const enumOptions = options as [string, ...string[]];
      return component.required
        ? z.enum(enumOptions, {
            message: `Please select a valid ${component.label.toLowerCase()}`
          })
        : z.enum(enumOptions, {
            message: `Please select a valid ${component.label.toLowerCase()}`
          }).optional();

    case 'checkbox':
      return z.array(z.string()).optional();

    case 'file':
      return component.required
        ? z.instanceof(File, { message: `${component.label} is required` })
        : z.instanceof(File).optional();

    default:
      return baseSchema;
  }
};

// Tag field validation based on TagCategory component style
export const createTagFieldSchema = (category: TagWithKey) => {
  const fieldName = category.name;
  
  switch (category.component_style) {
    case 'dropdown':
    case 'radio':
      return category.is_required
        ? z.string().min(1, `${fieldName} is required`)
        : z.string().optional();

    case 'multiselect':
    case 'checkbox':
    case 'list':
      return category.is_required
        ? z.array(z.string()).min(1, `At least one ${fieldName.toLowerCase()} must be selected`)
        : z.array(z.string()).optional();

    default:
      return z.any().optional();
  }
};

// Function to create complete form schema dynamically
export const createMemberFormSchema = (
  customFields: FormComponent[] = [],
  tagCategories: TagWithKey[] = []
) => {
  // Add custom fields
  const customFieldsShape: Record<string, z.ZodTypeAny> = {};
  customFields.forEach((field) => {
    const fieldKey = `custom_${field.id}`;
    customFieldsShape[fieldKey] = createDynamicFieldSchema(field);
  });

  // Add tag fields
  const tagFieldsShape: Record<string, z.ZodTypeAny> = {};
  tagCategories.forEach((category) => {
    const fieldKey = `tag_${category.id}`;
    tagFieldsShape[fieldKey] = createTagFieldSchema(category);
  });

  // Combine all schemas - include all default membership fields
  const completeSchema = z.object({
    ...defaultMembershipSchema.shape,
    custom_fields: z.object(customFieldsShape).optional(),
    tags: z.object(tagFieldsShape).optional(),
  });

  return completeSchema;
};

// Type inference for the complete form data
export type MemberFormData = z.infer<typeof defaultMembershipSchema> & {
  custom_fields?: Record<string, any>;
  tags?: Record<string, any>;
};