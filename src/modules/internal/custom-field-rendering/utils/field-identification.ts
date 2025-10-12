import type { 
  FieldId, 
  FieldMetadata, 
  SavedFieldValue, 
  SavedFormData, 
  FieldMappingResult,
  FieldIdentificationConfig 
} from '../types';
import type { MembershipFormSchema, FormComponent } from '@/types/people-configurations';

/**
 * Default configuration for field identification
 */
export const DEFAULT_FIELD_ID_CONFIG: FieldIdentificationConfig = {
  includeTimestamp: true,
  showOrphanedFields: true,
  orphanedFieldMaxAge: 90, // 90 days
};

/**
 * Generate a unique, persistent field identifier
 * Format: {schemaId}_{rowId}_{columnId}_{timestamp}
 */
export function generateFieldId(
  schemaId: string,
  rowId: string,
  columnId: string,
  timestamp?: number
): FieldId {
  const ts = timestamp || Date.now();
  return `${schemaId}_${rowId}_${columnId}_${ts}`;
}

/**
 * Parse a field ID back into its components
 */
export function parseFieldId(fieldId: FieldId): {
  schemaId: string;
  rowId: string;
  columnId: string;
  timestamp: number;
} | null {
  const parts = fieldId.split('_');
  if (parts.length !== 4) return null;
  
  const [schemaId, rowId, columnId, timestampStr] = parts;
  const timestamp = parseInt(timestampStr, 10);
  
  if (isNaN(timestamp)) return null;
  
  return { schemaId, rowId, columnId, timestamp };
}

/**
 * Extract field metadata from schema component
 */
export function extractFieldMetadata(
  component: FormComponent,
  schemaId: string,
  rowId: string,
  columnId: string,
  fieldId?: FieldId
): FieldMetadata {
  const generatedFieldId = fieldId || generateFieldId(schemaId, rowId, columnId);
  
  return {
    fieldId: generatedFieldId,
    label: component.label || 'Untitled Field',
    type: component.type,
    required: component.required || false,
    schemaId,
    rowId,
    columnId,
    createdAt: Date.now(),
    options: component.options,
    dateFormat: component.dateFormat,
    fileSettings: component.fileSettings,
  };
}

/**
 * Create a map of current schema fields with their metadata
 */
export function createSchemaFieldMap(schema: MembershipFormSchema): Map<string, FieldMetadata> {
  const fieldMap = new Map<string, FieldMetadata>();
  
  if (!schema.rows) return fieldMap;
  
  for (const row of schema.rows) {
    for (const column of row.columns) {
      if (!column.component) continue;
      
      // Try to find existing field ID based on position
      const positionKey = `${schema.id}_${row.id}_${column.id}`;
      const metadata = extractFieldMetadata(
        column.component,
        schema.id,
        row.id,
        column.id
      );
      
      fieldMap.set(positionKey, metadata);
    }
  }
  
  return fieldMap;
}

/**
 * Map saved field values to current schema fields
 */
export function mapSavedValuesToSchema(
  savedData: SavedFormData,
  currentSchema: MembershipFormSchema,
  config: FieldIdentificationConfig = DEFAULT_FIELD_ID_CONFIG
): FieldMappingResult {
  const currentFieldMap = createSchemaFieldMap(currentSchema);
  const result: FieldMappingResult = {
    mapped: [],
    orphaned: [],
    missing: [],
  };
  
  // Track which current fields have been mapped
  const mappedCurrentFields = new Set<string>();
  
  // Process saved fields
  for (const [fieldId, savedValue] of Object.entries(savedData.fields)) {
    const parsedId = parseFieldId(fieldId);
    if (!parsedId) {
      // Invalid field ID format, treat as orphaned
      result.orphaned.push({
        fieldId,
        value: savedValue.value,
        savedMetadata: savedValue.metadata,
      });
      continue;
    }
    
    // Try to find matching field in current schema by position
    const positionKey = `${parsedId.schemaId}_${parsedId.rowId}_${parsedId.columnId}`;
    const currentMetadata = currentFieldMap.get(positionKey);
    
    if (currentMetadata) {
      // Field exists in current schema
      result.mapped.push({
        fieldId,
        value: savedValue.value,
        currentMetadata,
        savedMetadata: savedValue.metadata,
      });
      mappedCurrentFields.add(positionKey);
    } else {
      // Field doesn't exist in current schema
      const daysSinceSaved = (Date.now() - savedValue.savedAt) / (1000 * 60 * 60 * 24);
      
      if (config.showOrphanedFields && daysSinceSaved <= config.orphanedFieldMaxAge) {
        result.orphaned.push({
          fieldId,
          value: savedValue.value,
          savedMetadata: savedValue.metadata,
        });
      }
    }
  }
  
  // Find fields in current schema that have no saved values
  for (const [positionKey, metadata] of currentFieldMap) {
    if (!mappedCurrentFields.has(positionKey)) {
      result.missing.push({
        fieldId: metadata.fieldId,
        currentMetadata: metadata,
      });
    }
  }
  
  return result;
}

/**
 * Create saved form data from current values and schema
 */
export function createSavedFormData(
  values: Record<string, any>,
  schema: MembershipFormSchema,
  schemaVersion?: number
): SavedFormData {
  const fieldMap = createSchemaFieldMap(schema);
  const fields: Record<FieldId, SavedFieldValue> = {};
  const now = Date.now();
  
  for (const [, metadata] of fieldMap) {
    const fieldValue = values[`${metadata.rowId}-${metadata.columnId}`];
    
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      fields[metadata.fieldId] = {
        fieldId: metadata.fieldId,
        value: fieldValue,
        metadata,
        savedAt: now,
      };
    }
  }
  
  return {
    schemaId: schema.id,
    schemaVersion: schemaVersion || now,
    fields,
    savedAt: now,
  };
}

/**
 * Convert saved form data back to form values format
 */
export function convertSavedDataToFormValues(
  savedData: SavedFormData,
  currentSchema: MembershipFormSchema,
  config: FieldIdentificationConfig = DEFAULT_FIELD_ID_CONFIG
): Record<string, any> {
  const mappingResult = mapSavedValuesToSchema(savedData, currentSchema, config);
  const formValues: Record<string, any> = {};
  
  // Map successfully matched fields
  for (const mapped of mappingResult.mapped) {
    const parsedId = parseFieldId(mapped.fieldId);
    if (parsedId) {
      const formKey = `${parsedId.rowId}-${parsedId.columnId}`;
      formValues[formKey] = mapped.value;
    }
  }
  
  return formValues;
}