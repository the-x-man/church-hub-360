import { useMemo, useCallback } from 'react';
import type { 
  SavedFormData, 
  SavedFieldValue,
  FieldId
} from '../types';
import type { 
  FormValidationResult,
  FieldValidationResult
} from '../utils/schema-validation';
import type { 
  MembershipFormSchema,
  FormRow,
  FormColumn,
  FormComponent
} from '@/types/people-configurations';
import { 
  validateSavedFormData, 
  validateFieldValue, 
  fieldExistsInSchema,
  getFieldMetadataFromSchema
} from '../utils/schema-validation';

/**
 * Configuration for schema validation hook
 */
export interface UseSchemaValidationConfig {
  /** Whether to validate in real-time */
  realTimeValidation: boolean;
  /** Whether to show warnings for orphaned fields */
  showOrphanedFieldWarnings: boolean;
  /** Custom validation functions for specific field types */
  customValidators?: Record<string, (value: any) => FieldValidationResult>;
}

/**
 * Hook result interface
 */
export interface UseSchemaValidationResult {
  /** Current validation result */
  validationResult: FormValidationResult;
  /** Field-level errors */
  fieldErrors: Record<string, string>;
  /** Field-level warnings */
  fieldWarnings: Record<string, string>;
  /** Orphaned fields (exist in saved data but not in current schema) */
  orphanedFields: string[];
  /** Valid fields that exist in both saved data and current schema */
  validFields: string[];
  /** Validate a specific field */
  validateField: (fieldId: string, value: any) => FieldValidationResult;
  /** Validate the entire form */
  validateAllFields: () => FormValidationResult;
  /** Clear field errors */
  clearFieldErrors: (fieldId: string) => void;
  /** Clear all errors */
  clearAllErrors: () => void;
  /** Check if a field exists in the current schema */
  fieldExists: (fieldName: string) => boolean;
  /** Get validation summary */
  getValidationSummary: () => any;
  /** Whether the form is valid */
  isValid: boolean;
}

/**
 * Hook for schema validation of saved form data
 */
export function useSchemaValidation(
  savedData: SavedFormData | null,
  schema: MembershipFormSchema
): UseSchemaValidationResult {
  // Memoized validation result
  const validationResult = useMemo(() => {
    if (!savedData || !schema.rows?.length) {
      return {
        isValid: true,
        fieldResults: {},
        globalErrors: [],
        globalWarnings: [],
        summary: {
          totalFields: 0,
          validFields: 0,
          invalidFields: 0,
          orphanedFields: 0,
        },
      };
    }

    return validateSavedFormData(savedData, schema);
  }, [savedData, schema]);

  // Extract field errors and warnings
  const { fieldErrors, fieldWarnings } = useMemo(() => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    Object.entries(validationResult.fieldResults).forEach(([fieldName, result]) => {
      if (!result.isValid && result.errors) {
        errors[fieldName] = result.errors.join(', ');
      }
      if (result.warnings) {
        warnings[fieldName] = result.warnings.join(', ');
      }
    });

    return { fieldErrors: errors, fieldWarnings: warnings };
  }, [validationResult.fieldResults]);

  // Extract orphaned and valid fields
  const { orphanedFields, validFields } = useMemo(() => {
    if (!savedData?.fields) {
      return { orphanedFields: [], validFields: [] };
    }

    const orphaned: string[] = [];
    const valid: string[] = [];

    Object.values(savedData.fields).forEach((field: SavedFieldValue) => {
      const fieldName = field.metadata?.label || field.fieldId.split('_')[2];
      if (fieldExistsInSchema(field.fieldId, schema)) {
        valid.push(fieldName);
      } else {
        orphaned.push(fieldName);
      }
    });

    return { orphanedFields: orphaned, validFields: valid };
  }, [savedData, schema]);

  // Validate a specific field
  const validateField = useCallback((fieldId: FieldId): FieldValidationResult => {
    if (!savedData?.fields) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const field = Object.values(savedData.fields).find((f: SavedFieldValue) => f.fieldId === fieldId);
    if (!field) {
      return { isValid: true, errors: [], warnings: [] };
    }

    // Find the schema field
    const schemaField = schema.rows
      .flatMap((row: FormRow) => row.columns)
      .map((column: FormColumn) => column.component)
      .filter((component: FormComponent | null) => component !== null)
      .find((component: FormComponent) => component!.id === fieldId.split('_')[2]);

    if (!schemaField) {
      return { isValid: false, errors: ['Field not found in schema'], warnings: [] };
    }

    const metadata = getFieldMetadataFromSchema(schemaField.id, schema);
    if (!metadata) {
      return { isValid: false, errors: ['Field metadata not found'], warnings: [] };
    }
    return validateFieldValue(field.value, metadata);
  }, [savedData, schema]);

  // Validate the entire form
  const validateForm = useCallback((): FormValidationResult => {
    if (!savedData) {
      return {
        isValid: true,
        fieldResults: {},
        globalErrors: [],
        globalWarnings: [],
        summary: {
          totalFields: 0,
          validFields: 0,
          invalidFields: 0,
          orphanedFields: 0,
        },
      };
    }
    return validateSavedFormData(savedData, schema);
  }, [savedData, schema]);

  // Check if a field exists in the schema
  const fieldExists = useCallback((fieldName: string): boolean => {
    return schema.rows
      .flatMap((row: FormRow) => row.columns)
      .map((column: FormColumn) => column.component)
      .filter((component: FormComponent | null) => component !== null)
      .some((component: FormComponent) => component!.label === fieldName);
  }, [schema]);

  // Get validation summary
  const getValidationSummary = useCallback(() => {
    return validationResult.summary;
  }, [validationResult.summary]);

  return {
    validationResult,
    isValid: validationResult.isValid,
    fieldErrors,
    fieldWarnings,
    orphanedFields,
    validFields,
    validateField,
    validateAllFields: validateForm,
    clearFieldErrors: () => {}, // Placeholder implementation
    clearAllErrors: () => {}, // Placeholder implementation
    fieldExists,
    getValidationSummary,
  };
}