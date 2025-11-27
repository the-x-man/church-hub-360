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

    // Find the exact match in schema by iterating through rows and columns
    // This is safer than splitting the key which might fail with UUIDs containing dashes
    let matchedRowId: string | null = null;
    let matchedColId: string | null = null;
    let componentId: string | null = null;
    let componentType: string | null = null;
    
    for (const row of membershipFormSchema.rows) {
      // Optimization: Check if fieldKey starts with row.id to narrow down
      if (fieldKey.startsWith(row.id)) {
        for (const column of row.columns) {
          const potentialKey = `${row.id}-${column.id}`;
          if (potentialKey === fieldKey && column.component) {
            matchedRowId = row.id;
            matchedColId = column.id;
            componentId = column.component.id;
            componentType = column.component.type;
            break;
          }
        }
      }
      if (matchedRowId) break;
    }

    // Only store if we found the component
    if (matchedRowId && matchedColId && componentId && componentType) {
      flattenedFormData[fieldKey] = {
        value: fieldValue,
        rowId: matchedRowId,
        columnId: matchedColId,
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