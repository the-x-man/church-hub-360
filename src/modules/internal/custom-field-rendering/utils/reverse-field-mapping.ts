import type { MembershipFormSchema } from '@/types/people-configurations';
import type { FlattenedFieldData } from './flattened-field-converter';
import { getValidFieldsForRendering } from './field-validation';

/**
 * Converts saved flattened field data back to form field values
 * Applies the same validation rules used in the display renderer
 * @param savedData - The saved custom form data (can be flattened array or object format)
 * @param schema - Current membership form schema
 * @returns Record of field IDs to their values for form population
 */
export function convertSavedDataToFormValues(
  savedData: any,
  schema: MembershipFormSchema | null | undefined
): Record<string, any> {
  if (!savedData || !schema) {
    return {};
  }

  // Handle different saved data formats
  let flattenedData: FlattenedFieldData[] = [];

  if (Array.isArray(savedData)) {
    // Already in flattened array format
    flattenedData = savedData;
  } else if (typeof savedData === 'object') {
    // Check if it's the new flattened object format
    if (Object.values(savedData).some((value: any) => 
      value && typeof value === 'object' && 
      'rowId' in value && 'columnId' in value && 'componentId' in value
    )) {
      // Convert flattened object format to array
      flattenedData = Object.values(savedData) as FlattenedFieldData[];
    } else {
      // Handle legacy format - convert key-value pairs to flattened format
      flattenedData = convertLegacyDataToFlattened(savedData, schema);
    }
  }

  // Apply the same validation rules as the display renderer
  const validFields = getValidFieldsForRendering(flattenedData, schema);

  // Convert valid fields back to form field values
  const formValues: Record<string, any> = {};

  validFields.forEach(field => {
    // Create field ID in the format expected by CustomFieldsRenderer
    const fieldId = `${field.rowId}-${field.columnId}`;
    formValues[fieldId] = field.value;
  });

  return formValues;
}

/**
 * Converts legacy saved data format to flattened format
 * @param legacyData - Legacy key-value format
 * @param schema - Current membership form schema
 * @returns Array of flattened field data
 */
function convertLegacyDataToFlattened(
  legacyData: Record<string, any>,
  schema: MembershipFormSchema
): FlattenedFieldData[] {
  const flattenedData: FlattenedFieldData[] = [];

  // Iterate through schema to match legacy field keys
  schema.rows.forEach(row => {
    row.columns.forEach(column => {
      if (!column.component) return;

      const component = column.component;
      const expectedFieldId = `${row.id}-${column.id}`;
      
      // Try different key formats that might exist in legacy data
      const possibleKeys = [
        expectedFieldId,
        component.id,
        column.id,
        `${row.id}_${column.id}`,
        `row-${row.id}-col-${column.id}`
      ];

      for (const key of possibleKeys) {
        if (key in legacyData) {
          flattenedData.push({
            rowId: row.id,
            columnId: column.id,
            componentId: component.id,
            componentType: component.type,
            value: legacyData[key]
          });
          break; // Found a match, move to next field
        }
      }
    });
  });

  return flattenedData;
}

/**
 * Extracts field values from SavedFormData format used by hooks
 * @param savedFormData - SavedFormData format with metadata
 * @param schema - Current membership form schema
 * @returns Record of field IDs to their values
 */
export function extractValuesFromSavedFormData(
  savedFormData: { fields: Record<string, { value: any; metadata?: any }> },
  schema: MembershipFormSchema | null | undefined
): Record<string, any> {
  if (!savedFormData?.fields || !schema) {
    return {};
  }

  const formValues: Record<string, any> = {};

  // Convert SavedFormData format to flattened format first
  const flattenedData: FlattenedFieldData[] = [];

  Object.entries(savedFormData.fields).forEach(([fieldKey, fieldData]) => {
    // Try to match the field key to schema components
    schema.rows.forEach(row => {
      row.columns.forEach(column => {
        if (!column.component) return;

        const component = column.component;
        const expectedFieldId = `${row.id}-${column.id}`;

        // Check if this field matches the current schema component
        if (fieldKey === expectedFieldId || 
            fieldKey === component.id || 
            fieldKey.includes(component.id) ||
            fieldKey === column.id) {
          
          flattenedData.push({
            rowId: row.id,
            columnId: column.id,
            componentId: component.id,
            componentType: component.type,
            value: fieldData.value
          });
        }
      });
    });
  });

  // Apply validation and convert to form values
  const validFields = getValidFieldsForRendering(flattenedData, schema);
  
  validFields.forEach(field => {
    const fieldId = `${field.rowId}-${field.columnId}`;
    formValues[fieldId] = field.value;
  });

  return formValues;
}