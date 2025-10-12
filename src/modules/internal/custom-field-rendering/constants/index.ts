import type { FieldIdentificationConfig } from '../types';

/**
 * Default configuration for field identification and mapping
 */
export const DEFAULT_FIELD_MAPPING_CONFIG: FieldIdentificationConfig = {
  includeTimestamp: true,
  showOrphanedFields: true,
  orphanedFieldMaxAge: 90, // 90 days
};

/**
 * Field types that support validation
 */
export const VALIDATABLE_FIELD_TYPES = [
  'text',
  'email',
  'phone',
  'number',
  'date',
  'select',
  'radio',
  'checkbox',
  'file',
  'textarea',
] as const;

/**
 * Field types that require special handling during rendering
 */
export const SPECIAL_FIELD_TYPES = {
  FILE: 'file',
  DATE: 'date',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  SELECT: 'select',
  EMAIL: 'email',
  PHONE: 'phone',
  TEXTAREA: 'textarea',
} as const;

/**
 * Default placeholders for different field types
 */
export const DEFAULT_PLACEHOLDERS: Record<string, string> = {
  text: 'Enter text...',
  email: 'Enter email address...',
  phone: 'Enter phone number...',
  number: 'Enter number...',
  textarea: 'Enter your message...',
  select: 'Select an option...',
  date: 'Select date...',
  file: 'Choose file...',
  radio: 'Select an option...',
  checkbox: 'Select options...',
};

/**
 * Maximum file size for uploads (in bytes)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Default accepted file types for file fields
 */
export const DEFAULT_ACCEPTED_FILE_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
];

/**
 * Date formats supported by the system
 */
export const SUPPORTED_DATE_FORMATS = {
  'PPP': 'Jan 1, 2023',
  'PP': '01/01/2023',
  'P': '1/1/23',
  'yyyy-MM-dd': '2023-01-01',
  'dd/MM/yyyy': '01/01/2023',
  'MM/dd/yyyy': '01/01/2023',
} as const;

/**
 * Error messages for field validation
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: (fieldName: string) => `${fieldName} is required`,
  INVALID_EMAIL: (fieldName: string) => `${fieldName} must be a valid email address`,
  INVALID_PHONE: (fieldName: string) => `${fieldName} may not be a valid phone number`,
  INVALID_NUMBER: (fieldName: string) => `${fieldName} must be a valid number`,
  INVALID_DATE: (fieldName: string) => `${fieldName} must be a valid date`,
  INVALID_OPTION: (fieldName: string) => `${fieldName} must be one of the available options`,
  INVALID_FILE_TYPE: (fieldName: string, types: string[]) => 
    `${fieldName} must be one of these file types: ${types.join(', ')}`,
  FILE_TOO_LARGE: (fieldName: string, maxSize: string) => 
    `${fieldName} file size must be less than ${maxSize}`,
} as const;

/**
 * CSS classes for different field states
 */
export const FIELD_CLASSES = {
  BASE: 'w-full',
  ERROR: 'border-destructive focus:border-destructive',
  SUCCESS: 'border-green-500 focus:border-green-500',
  WARNING: 'border-yellow-500 focus:border-yellow-500',
  DISABLED: 'opacity-50 cursor-not-allowed',
} as const;

/**
 * Layout configurations for form rows
 */
export const LAYOUT_CONFIGS = {
  SINGLE_COLUMN: 1,
  TWO_COLUMNS: 2,
  THREE_COLUMNS: 3,
} as const;

/**
 * Grid classes for different layouts
 */
export const GRID_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
};

/**
 * Responsive grid classes for different layouts
 */
export const RESPONSIVE_GRID_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};