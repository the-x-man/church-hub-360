import type { MembershipFormSchema } from '@/types/people-configurations';

/**
 * Flattened field data structure for optimized storage
 */
export interface FlattenedFieldData {
  value: any;
  rowId: string;
  columnId: string;
  componentId: string;
  componentType: string;
}

/**
 * Result of the flattened field conversion
 */
export interface FlattenedFormData {
  [fieldKey: string]: FlattenedFieldData;
}

/**
 * Converts processed custom fields to flattened format
 * @param processedCustomFields - The custom field values from the form
 * @param membershipFormSchema - The schema to extract metadata from
 * @returns Flattened form data with value, rowId, columnId, and componentId
 */
export function convertToFlattenedFieldData(
  processedCustomFields: Record<string, any>,
  membershipFormSchema: MembershipFormSchema | null
): FlattenedFormData {
  const flattenedFormData: FlattenedFormData = {};

  if (!membershipFormSchema) {
    console.warn('No membership form schema provided for field conversion');
    return flattenedFormData;
  }

  // Process each custom field value
  Object.entries(processedCustomFields).forEach(([fieldKey, fieldValue]) => {
    // Skip empty or undefined values
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      return;
    }

    // Extract parts from fieldKey (format: row-{rowId}-col-{colId}-{index})
    const parts = fieldKey.split('-');
    if (parts.length < 5) {
      console.warn(`Invalid field key format: ${fieldKey}`);
      return;
    }

    const rowId = `${parts[0]}-${parts[1]}`; // row-{rowId}
    const fullColId = `${parts[2]}-${parts[3]}-${parts[4]}`; // col-{colId}-{index}

    // Find the exact match in schema
    let componentId: string | null = null;
    let componentType: string | null = null;
    
    for (const row of membershipFormSchema.rows) {
      if (row.id === rowId) {
        for (const column of row.columns) {
          if (column.id === fullColId && column.component) {
            componentId = column.component.id;
            componentType = column.component.type;
            break;
          }
        }
        if (componentId) break;
      }
    }

    // Only store if we found the component
    if (componentId && componentType) {
      flattenedFormData[fieldKey] = {
        value: fieldValue,
        rowId,
        columnId: fullColId,
        componentId,
        componentType
      };
    } else {
      console.warn(`Component not found for field key: ${fieldKey}`);
    }
  });

  return flattenedFormData;
}

/**
 * Retrieves component metadata from schema using componentId
 * @param componentId - The component ID to look for
 * @param membershipFormSchema - The schema to search in
 * @returns Component metadata or null if not found
 */
export function getComponentMetadata(
  componentId: string,
  membershipFormSchema: MembershipFormSchema | null
) {
  if (!membershipFormSchema) return null;

  for (const row of membershipFormSchema.rows) {
    for (const column of row.columns) {
      if (column.component && column.component.id === componentId) {
        return {
          id: column.component.id,
          label: column.component.label,
          type: column.component.type,
          required: column.component.required || false,
          options: column.component.options,
          placeholder: column.component.placeholder,
          validation: column.component.validation,
          tagReference: column.component.tagReference,
          dateFormat: column.component.dateFormat,
          fileSettings: column.component.fileSettings
        };
      }
    }
  }

  return null;
}