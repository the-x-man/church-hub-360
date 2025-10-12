// Field Identification and Schema Evolution Types

/**
 * Unique identifier for a form field that persists across schema changes
 * Format: {schemaId}_{rowId}_{columnId}_{timestamp}
 */
export type FieldId = string;

/**
 * Metadata about a field that helps with identification and rendering
 */
export interface FieldMetadata {
  /** Unique field identifier that persists across schema changes */
  fieldId: FieldId;
  /** Current label from schema (can change) */
  label: string;
  /** Field type (text, email, date, etc.) */
  type: string;
  /** Whether the field is required */
  required: boolean;
  /** Schema ID this field belongs to */
  schemaId: string;
  /** Row ID within the schema */
  rowId: string;
  /** Column ID within the row */
  columnId: string;
  /** Timestamp when field was created */
  createdAt: number;
  /** Additional field-specific options */
  options?: string[];
  /** Date format for date fields */
  dateFormat?: string;
  /** File settings for file fields */
  fileSettings?: {
    acceptedFileTypes?: string[];
    dropzoneText?: string;
  };
}

/**
 * Saved field value with persistent identification
 */
export interface SavedFieldValue {
  /** Unique field identifier */
  fieldId: FieldId;
  /** The actual value */
  value: any;
  /** Metadata at the time of saving (for fallback) */
  metadata: FieldMetadata;
  /** When this value was saved */
  savedAt: number;
}

/**
 * Collection of saved field values for a form submission
 */
export interface SavedFormData {
  /** Schema ID this data was saved against */
  schemaId: string;
  /** Schema version/timestamp for tracking changes */
  schemaVersion: number;
  /** Map of field ID to saved value */
  fields: Record<FieldId, SavedFieldValue>;
  /** When this form data was saved */
  savedAt: number;
}

/**
 * Result of mapping saved values to current schema
 */
export interface FieldMappingResult {
  /** Successfully mapped fields */
  mapped: Array<{
    fieldId: FieldId;
    value: any;
    currentMetadata: FieldMetadata;
    savedMetadata: FieldMetadata;
  }>;
  /** Fields that exist in saved data but not in current schema */
  orphaned: Array<{
    fieldId: FieldId;
    value: any;
    savedMetadata: FieldMetadata;
  }>;
  /** Fields that exist in current schema but have no saved value */
  missing: Array<{
    fieldId: FieldId;
    currentMetadata: FieldMetadata;
  }>;
}

/**
 * Configuration for field identification strategy
 */
export interface FieldIdentificationConfig {
  /** Whether to include timestamp in field ID generation */
  includeTimestamp: boolean;
  /** Whether to show orphaned fields in read-only mode */
  showOrphanedFields: boolean;
  /** Maximum age (in days) for orphaned fields to be shown */
  orphanedFieldMaxAge: number;
}