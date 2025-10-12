// Field Identification utilities
export {
  generateFieldId,
  parseFieldId,
  extractFieldMetadata,
  createSchemaFieldMap,
  mapSavedValuesToSchema,
  createSavedFormData,
  DEFAULT_FIELD_ID_CONFIG,
} from './field-identification';

// Schema Validation utilities
export {
  validateFieldValue,
  validateSavedFormData,
  fieldExistsInSchema,
  getFieldMetadataFromSchema,
  filterValidFields,
} from './schema-validation';

// Schema Evolution utilities
export {
  analyzeSchemaEvolution,
  createCommonMigrationRules,
  applySchemaEvolution,
  generateSchemaEvolutionReport,
  DEFAULT_SCHEMA_EVOLUTION_CONFIG,
} from './schema-evolution';

export type {
  SchemaChange,
  SchemaEvolutionConfig,
  FieldMigrationRule,
  SchemaEvolutionResult,
} from './schema-evolution';

// Flattened Field Converter
export {
  convertToFlattenedFieldData,
  getComponentMetadata,
  type FlattenedFieldData,
  type FlattenedFormData,
} from './flattened-field-converter';

// Reverse Field Mapping
export {
  convertSavedDataToFormValues,
  extractValuesFromSavedFormData,
} from './reverse-field-mapping';

// Field Validation
export {
  validateFieldsAgainstSchema,
  areComponentTypesCompatible,
  getValidFieldsForRendering,
  type ValidatedFieldData,
  type SchemaValidationResult,
} from './field-validation';