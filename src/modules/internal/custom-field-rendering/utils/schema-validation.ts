import type { 
  SavedFormData, 
  FieldMetadata 
} from '../types';
import type { MembershipFormSchema } from '@/types/people-configurations';
import { mapSavedValuesToSchema } from './field-identification';

/**
 * Validation result for a field value
 */
export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validation result for entire form data
 */
export interface FormValidationResult {
  isValid: boolean;
  fieldResults: Record<string, FieldValidationResult>;
  globalErrors: string[];
  globalWarnings: string[];
  summary: {
    totalFields: number;
    validFields: number;
    invalidFields: number;
    orphanedFields: number;
  };
}

/**
 * Validate a single field value against its metadata
 */
export function validateFieldValue(
  value: any,
  metadata: FieldMetadata
): FieldValidationResult {
  const result: FieldValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check required fields
  if (metadata.required && (value === null || value === undefined || value === '')) {
    result.isValid = false;
    result.errors.push(`${metadata.label} is required`);
    return result;
  }

  // Skip validation for empty optional fields
  if (value === null || value === undefined || value === '') {
    return result;
  }

  // Type-specific validation
  switch (metadata.type) {
    case 'email':
      if (typeof value === 'string' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          result.isValid = false;
          result.errors.push(`${metadata.label} must be a valid email address`);
        }
      }
      break;

    case 'phone':
      if (typeof value === 'string' && value) {
        // Basic phone validation - adjust regex as needed
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          result.warnings.push(`${metadata.label} may not be a valid phone number`);
        }
      }
      break;

    case 'number':
      if (value !== null && value !== undefined) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          result.isValid = false;
          result.errors.push(`${metadata.label} must be a valid number`);
        }
      }
      break;

    case 'date':
      if (typeof value === 'string' && value) {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          result.isValid = false;
          result.errors.push(`${metadata.label} must be a valid date`);
        }
      }
      break;

    case 'select':
    case 'radio':
      if (metadata.options && metadata.options.length > 0) {
        if (typeof value === 'string' && !metadata.options.includes(value)) {
          result.isValid = false;
          result.errors.push(`${metadata.label} must be one of the available options`);
        }
      }
      break;

    case 'checkbox':
      if (Array.isArray(value) && metadata.options && metadata.options.length > 0) {
        const invalidOptions = value.filter(v => !metadata.options!.includes(v));
        if (invalidOptions.length > 0) {
          result.isValid = false;
          result.errors.push(`${metadata.label} contains invalid options: ${invalidOptions.join(', ')}`);
        }
      }
      break;

    case 'file':
      if (value && typeof value === 'object' && value.name) {
        if (metadata.fileSettings?.acceptedFileTypes) {
          const fileName = value.name.toLowerCase();
          const hasValidExtension = metadata.fileSettings.acceptedFileTypes.some(type => 
            fileName.endsWith(type.toLowerCase().replace('.', ''))
          );
          if (!hasValidExtension) {
            result.isValid = false;
            result.errors.push(`${metadata.label} must be one of these file types: ${metadata.fileSettings.acceptedFileTypes.join(', ')}`);
          }
        }
      }
      break;
  }

  return result;
}

/**
 * Validate saved form data against current schema
 */
export function validateSavedFormData(
  savedData: SavedFormData,
  currentSchema: MembershipFormSchema
): FormValidationResult {
  const mappingResult = mapSavedValuesToSchema(savedData, currentSchema);
  const formResult: FormValidationResult = {
    isValid: true,
    fieldResults: {},
    globalErrors: [],
    globalWarnings: [],
    summary: {
      totalFields: mappingResult.mapped.length + mappingResult.orphaned.length,
      validFields: 0,
      invalidFields: 0,
      orphanedFields: mappingResult.orphaned.length,
    },
  };

  // Validate mapped fields
  for (const mapped of mappingResult.mapped) {
    const fieldResult = validateFieldValue(mapped.value, mapped.currentMetadata);
    formResult.fieldResults[mapped.fieldId] = fieldResult;
    
    if (!fieldResult.isValid) {
      formResult.isValid = false;
      formResult.summary.invalidFields++;
    } else {
      formResult.summary.validFields++;
    }
  }

  // Add warnings for orphaned fields
  if (mappingResult.orphaned.length > 0) {
    formResult.globalWarnings.push(
      `${mappingResult.orphaned.length} field(s) from saved data no longer exist in the current form`
    );
  }

  // Add info about missing fields (fields in schema but no saved value)
  if (mappingResult.missing.length > 0) {
    const requiredMissing = mappingResult.missing.filter(m => m.currentMetadata.required);
    if (requiredMissing.length > 0) {
      formResult.isValid = false;
      formResult.globalErrors.push(
        `${requiredMissing.length} required field(s) are missing values`
      );
    }
  }

  return formResult;
}

/**
 * Check if a field exists in the current schema
 */
export function fieldExistsInSchema(
  fieldId: string,
  schema: MembershipFormSchema
): boolean {
  if (!schema.rows) return false;

  // Parse field ID to get position
  const parts = fieldId.split('_');
  if (parts.length !== 4) return false;

  const [schemaId, rowId, columnId] = parts;
  
  // Check if schema ID matches
  if (schemaId !== schema.id) return false;

  // Find the row and column
  const row = schema.rows.find(r => r.id === rowId);
  if (!row) return false;

  const column = row.columns.find(c => c.id === columnId);
  if (!column || !column.component) return false;

  return true;
}

/**
 * Get field metadata from current schema by field ID
 */
export function getFieldMetadataFromSchema(
  fieldId: string,
  schema: MembershipFormSchema
): FieldMetadata | null {
  if (!fieldExistsInSchema(fieldId, schema)) return null;

  const parts = fieldId.split('_');
  const [schemaId, rowId, columnId, timestampStr] = parts;
  const timestamp = parseInt(timestampStr, 10);

  const row = schema.rows!.find(r => r.id === rowId)!;
  const column = row.columns.find(c => c.id === columnId)!;
  const component = column.component!;

  return {
    fieldId,
    label: component.label || 'Untitled Field',
    type: component.type,
    required: component.required || false,
    schemaId,
    rowId,
    columnId,
    createdAt: timestamp,
    options: component.options,
    dateFormat: component.dateFormat,
    fileSettings: component.fileSettings,
  };
}

/**
 * Filter saved form data to only include fields that exist in current schema
 */
export function filterValidFields(
  savedData: SavedFormData,
  currentSchema: MembershipFormSchema
): SavedFormData {
  const validFields: Record<string, any> = {};

  for (const [fieldId, savedValue] of Object.entries(savedData.fields)) {
    if (fieldExistsInSchema(fieldId, currentSchema)) {
      validFields[fieldId] = savedValue;
    }
  }

  return {
    ...savedData,
    fields: validFields,
  };
}