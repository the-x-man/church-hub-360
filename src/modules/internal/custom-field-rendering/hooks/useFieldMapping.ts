import { useMemo, useCallback } from 'react';
import type { 
  SavedFormData, 
  FieldMappingResult, 
  FieldIdentificationConfig 
} from '../types';
import type { MembershipFormSchema } from '@/types/people-configurations';
import { 
  mapSavedValuesToSchema, 
  convertSavedDataToFormValues,
  createSavedFormData,
  DEFAULT_FIELD_ID_CONFIG 
} from '../utils/field-identification';
import { validateSavedFormData, filterValidFields } from '../utils/schema-validation';

export interface UseFieldMappingResult {
  mappingResult: FieldMappingResult | null;
  formValues: Record<string, any> | null;
  validationResult: any;
  filteredData: SavedFormData | null;
  createSavedData: (formValues: Record<string, any>) => SavedFormData;
  fieldExists: (fieldId: string) => boolean;
  getCurrentMetadata: (fieldId: string) => any;
  getSavedMetadata: (fieldId: string) => any;
  stats: {
    totalSavedFields: number;
    mappedFields: number;
    orphanedFields: number;
    missingFields: number;
    mappingRate: number;
  };
  hasData: boolean;
  hasSchema: boolean;
  isValid: boolean;
  hasOrphanedFields: boolean;
  hasMissingFields: boolean;
}

/**
 * Hook for managing field mapping between saved data and current schema
 */
export function useFieldMapping(
  savedData: SavedFormData | null,
  currentSchema: MembershipFormSchema | null,
  config: FieldIdentificationConfig = DEFAULT_FIELD_ID_CONFIG
) {
  // Memoized mapping result
  const mappingResult = useMemo<FieldMappingResult | null>(() => {
    if (!savedData || !currentSchema) return null;
    return mapSavedValuesToSchema(savedData, currentSchema, config);
  }, [savedData, currentSchema, config]);

  // Memoized form values for editing
  const formValues = useMemo<Record<string, any>>(() => {
    if (!savedData || !currentSchema) return {};
    return convertSavedDataToFormValues(savedData, currentSchema, config);
  }, [savedData, currentSchema, config]);

  // Memoized validation result
  const validationResult = useMemo(() => {
    if (!savedData || !currentSchema) return null;
    return validateSavedFormData(savedData, currentSchema);
  }, [savedData, currentSchema]);

  // Memoized filtered data (only valid fields)
  const filteredData = useMemo<SavedFormData | null>(() => {
    if (!savedData || !currentSchema) return null;
    return filterValidFields(savedData, currentSchema);
  }, [savedData, currentSchema]);

  // Helper to create saved data from current form values
  const createSavedData = useCallback((
    values: Record<string, any>,
    schemaVersion?: number
  ): SavedFormData | null => {
    if (!currentSchema) return null;
    return createSavedFormData(values, currentSchema, schemaVersion);
  }, [currentSchema]);

  // Helper to check if field exists in current schema
  const fieldExists = useCallback((fieldId: string): boolean => {
    if (!mappingResult) return false;
    return mappingResult.mapped.some(m => m.fieldId === fieldId);
  }, [mappingResult]);

  // Helper to get current metadata for a field
  const getCurrentMetadata = useCallback((fieldId: string) => {
    if (!mappingResult) return null;
    const mapped = mappingResult.mapped.find(m => m.fieldId === fieldId);
    return mapped?.currentMetadata || null;
  }, [mappingResult]);

  // Helper to get saved metadata for a field
  const getSavedMetadata = useCallback((fieldId: string) => {
    if (!mappingResult) return null;
    const mapped = mappingResult.mapped.find(m => m.fieldId === fieldId);
    return mapped?.savedMetadata || null;
  }, [mappingResult]);

  // Statistics about the mapping
  const stats = useMemo(() => {
    if (!mappingResult) {
      return {
        totalSaved: 0,
        mapped: 0,
        orphaned: 0,
        missing: 0,
        mappingRate: 0,
      };
    }

    const totalSaved = Object.keys(savedData?.fields || {}).length;
    const mapped = mappingResult.mapped.length;
    const orphaned = mappingResult.orphaned.length;
    const missing = mappingResult.missing.length;
    const mappingRate = totalSaved > 0 ? (mapped / totalSaved) * 100 : 0;

    return {
      totalSaved,
      mapped,
      orphaned,
      missing,
      mappingRate,
    };
  }, [mappingResult, savedData]);

  return {
    // Core mapping data
    mappingResult,
    formValues,
    validationResult,
    filteredData,
    
    // Helper functions
    createSavedData,
    fieldExists,
    getCurrentMetadata,
    getSavedMetadata,
    
    // Statistics
    stats,
    
    // Computed flags
    hasData: !!savedData,
    hasSchema: !!currentSchema,
    isValid: validationResult?.isValid ?? true,
    hasOrphanedFields: (mappingResult?.orphaned.length ?? 0) > 0,
    hasMissingFields: (mappingResult?.missing.length ?? 0) > 0,
  };
}