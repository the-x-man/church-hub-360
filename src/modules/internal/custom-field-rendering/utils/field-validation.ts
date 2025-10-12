import type { MembershipFormSchema, FormRow, FormColumn } from '@/types/people-configurations';
import type { FlattenedFieldData } from './flattened-field-converter';

export interface ValidatedFieldData extends FlattenedFieldData {
  isValid: boolean;
  validationReason?: 'row_not_found' | 'column_not_found' | 'component_mismatch' | 'component_type_mismatch' | 'valid';
  schemaComponent?: {
    id: string;
    type: string;
    label: string;
    required?: boolean;
  };
}

export interface SchemaValidationResult {
  validFields: ValidatedFieldData[];
  invalidFields: ValidatedFieldData[];
}

/**
 * Validates flattened field data against the current membership form schema
 * @param flattenedData Array of flattened field data
 * @param schema Current membership form schema
 * @returns Validation result with valid and invalid fields
 */
export function validateFieldsAgainstSchema(
  flattenedData: FlattenedFieldData[],
  schema: MembershipFormSchema | null | undefined
): SchemaValidationResult {
  const validFields: ValidatedFieldData[] = [];
  const invalidFields: ValidatedFieldData[] = [];

  if (!schema || !schema.rows) {
    // If no schema, mark all fields as invalid
    flattenedData.forEach(field => {
      invalidFields.push({
        ...field,
        isValid: false,
        validationReason: 'row_not_found'
      });
    });
    return { validFields, invalidFields };
  }

  // Create a lookup map for faster schema access
  const schemaMap = createSchemaLookupMap(schema);

  flattenedData.forEach(field => {
    const validation = validateSingleField(field, schemaMap);
    
    if (validation.isValid) {
      validFields.push(validation);
    } else {
      invalidFields.push(validation);
    }
  });

  return { validFields, invalidFields };
}

/**
 * Creates a lookup map for efficient schema validation
 */
function createSchemaLookupMap(schema: MembershipFormSchema) {
  const map = new Map<string, {
    row: FormRow;
    column: FormColumn;
    component: NonNullable<FormColumn['component']>;
  }>();

  schema.rows.forEach(row => {
    row.columns.forEach(column => {
      if (column.component) {
        const key = `${row.id}_${column.id}`;
        map.set(key, {
          row,
          column,
          component: column.component
        });
      }
    });
  });

  return map;
}

/**
 * Validates a single field against the schema
 */
function validateSingleField(
  field: FlattenedFieldData,
  schemaMap: Map<string, {
    row: FormRow;
    column: FormColumn;
    component: NonNullable<FormColumn['component']>;
  }>
): ValidatedFieldData {
  const key = `${field.rowId}_${field.columnId}`;
  const schemaEntry = schemaMap.get(key);

  // Check if row and column exist in schema
  if (!schemaEntry) {
    return {
      ...field,
      isValid: false,
      validationReason: 'row_not_found' // This covers both row and column not found
    };
  }

  const { component } = schemaEntry;

  // Check if component ID matches
  if (component.id === field.componentId) {
    // Perfect match - component ID matches
    return {
      ...field,
      isValid: true,
      validationReason: 'valid',
      schemaComponent: component
    };
  }

  // Component ID doesn't match, check if component type is compatible
  if (component.type === field.componentType) {
    // Component type matches - data might be compatible
    return {
      ...field,
      isValid: true,
      validationReason: 'valid',
      schemaComponent: component
    };
  }

  // Component type doesn't match - data is incompatible
  return {
    ...field,
    isValid: false,
    validationReason: 'component_type_mismatch',
    schemaComponent: component
  };
}

/**
 * Checks if two component types are compatible for data display
 * This function can be extended to handle more complex compatibility rules
 */
export function areComponentTypesCompatible(
  savedType: string,
  schemaType: string
): boolean {
  // Exact match
  if (savedType === schemaType) {
    return true;
  }

  // Define compatible type mappings
  const compatibilityMap: Record<string, string[]> = {
    'text': ['email', 'phone', 'textarea'], // Text can display as email, phone, or textarea
    'email': ['text'], // Email can display as text
    'phone': ['text'], // Phone can display as text
    'number': ['text'], // Number can display as text
    'textarea': ['text'], // Textarea can display as text (truncated)
    'date': ['text'], // Date can display as text
  };

  const compatibleTypes = compatibilityMap[savedType] || [];
  return compatibleTypes.includes(schemaType);
}

/**
 * Filters and returns only valid fields for rendering
 */
export function getValidFieldsForRendering(
  flattenedData: FlattenedFieldData[],
  schema: MembershipFormSchema | null | undefined
): ValidatedFieldData[] {
  const { validFields } = validateFieldsAgainstSchema(flattenedData, schema);
  return validFields;
}