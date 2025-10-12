import type { 
  SavedFormData, 
  SavedFieldValue, 
  FieldMetadata,
  FieldId 
} from '../types';
import type { MembershipFormSchema } from '@/types/people-configurations';
import { fieldExistsInSchema, getFieldMetadataFromSchema } from './schema-validation';

/**
 * Represents a change in the schema
 */
export interface SchemaChange {
  type: 'added' | 'removed' | 'modified' | 'renamed';
  fieldId: FieldId;
  oldMetadata?: FieldMetadata;
  newMetadata?: FieldMetadata;
  timestamp: number;
}

/**
 * Configuration for schema evolution handling
 */
export interface SchemaEvolutionConfig {
  /** Whether to track schema changes */
  trackChanges: boolean;
  /** Maximum age of orphaned fields in days */
  orphanedFieldMaxAge: number;
  /** Whether to attempt automatic field migration */
  autoMigrate: boolean;
  /** Custom migration rules */
  migrationRules?: FieldMigrationRule[];
}

/**
 * Rule for migrating fields between schema versions
 */
export interface FieldMigrationRule {
  /** Pattern to match old field names/types */
  from: {
    name?: string | RegExp;
    type?: string;
    label?: string | RegExp;
  };
  /** Target field configuration */
  to: {
    name: string;
    type?: string;
  };
  /** Custom transformation function */
  transform?: (value: any, oldMetadata: FieldMetadata, newMetadata: FieldMetadata) => any;
}

/**
 * Result of schema evolution analysis
 */
export interface SchemaEvolutionResult {
  changes: SchemaChange[];
  orphanedFields: SavedFieldValue[];
  migratedFields: Array<{
    from: SavedFieldValue;
    to: SavedFieldValue;
    rule: FieldMigrationRule;
  }>;
  validFields: SavedFieldValue[];
}

/**
 * Default configuration for schema evolution
 */
export const DEFAULT_SCHEMA_EVOLUTION_CONFIG: SchemaEvolutionConfig = {
  trackChanges: true,
  orphanedFieldMaxAge: 90, // 90 days
  autoMigrate: true,
  migrationRules: [],
};

/**
 * Analyzes schema evolution and identifies changes
 */
export function analyzeSchemaEvolution(
  savedData: SavedFormData,
  currentSchema: MembershipFormSchema,
  config: SchemaEvolutionConfig = DEFAULT_SCHEMA_EVOLUTION_CONFIG
): SchemaEvolutionResult {
  const result: SchemaEvolutionResult = {
    changes: [],
    orphanedFields: [],
    migratedFields: [],
    validFields: [],
  };

  const currentTime = Date.now();
  const maxAge = config.orphanedFieldMaxAge * 24 * 60 * 60 * 1000; // Convert days to milliseconds

  for (const fieldValue of Object.values(savedData.fields)) {
    const fieldExists = fieldExistsInSchema(fieldValue.fieldId, currentSchema);
    
    if (fieldExists) {
      result.validFields.push(fieldValue);
    } else {
      // Check if field is too old to keep
      const fieldAge = currentTime - fieldValue.savedAt;
      if (fieldAge > maxAge) {
        continue; // Skip very old orphaned fields
      }

      // Try to migrate the field if auto-migration is enabled
        if (config.autoMigrate && config.migrationRules) {
          const migrationResult = attemptFieldMigration(
            fieldValue,
            currentSchema,
            config.migrationRules
          );

        if (migrationResult) {
          result.migratedFields.push(migrationResult);
          result.validFields.push(migrationResult.to);
        } else {
          result.orphanedFields.push(fieldValue);
        }
      } else {
        result.orphanedFields.push(fieldValue);
      }
    }
  }

  return result;
}

/**
 * Attempts to migrate a field using migration rules
 */
function attemptFieldMigration(
  fieldValue: SavedFieldValue,
  currentSchema: MembershipFormSchema,
  migrationRules: FieldMigrationRule[]
): { from: SavedFieldValue; to: SavedFieldValue; rule: FieldMigrationRule } | null {
  const oldMetadata = fieldValue.metadata;
  
  for (const rule of migrationRules) {
    if (matchesMigrationRule(oldMetadata, rule.from)) {
      // Find the target field in the current schema
      const targetField = currentSchema.rows
        .flatMap(row => row.columns)
        .map(column => column.component)
        .filter(component => component !== null)
        .find(component => component!.label === rule.to.name);
      if (!targetField) continue;

      const newMetadata = getFieldMetadataFromSchema(targetField.id, currentSchema);
      if (!newMetadata) continue;

      // Transform the value if a transformation function is provided
      let newValue = fieldValue.value;
      if (rule.transform) {
        try {
          newValue = rule.transform(fieldValue.value, oldMetadata, newMetadata);
        } catch (error) {
          console.warn('Field migration transformation failed:', error);
          continue;
        }
      }

      // Create the migrated field value
      const migratedFieldValue: SavedFieldValue = {
        fieldId: newMetadata.fieldId,
        value: newValue,
        savedAt: Date.now(),
        metadata: newMetadata,
      };

      return {
        from: fieldValue,
        to: migratedFieldValue,
        rule,
      };
    }
  }

  return null;
}

/**
 * Checks if field metadata matches a migration rule pattern
 */
function matchesMigrationRule(
  metadata: FieldMetadata,
  pattern: FieldMigrationRule['from']
): boolean {
  // Check name pattern - use schemaId, rowId, columnId for matching since name might not exist
  if (pattern.name) {
    // For now, we'll skip name matching since FieldMetadata doesn't have a name property
    // This could be enhanced to extract name from fieldId or use other identifiers
  }

  // Check type pattern
  if (pattern.type && metadata.type !== pattern.type) {
    return false;
  }

  // Check label pattern
  if (pattern.label) {
    if (typeof pattern.label === 'string') {
      if (metadata.label !== pattern.label) return false;
    } else if (pattern.label instanceof RegExp) {
      if (!pattern.label.test(metadata.label)) return false;
    }
  }

  return true;
}

/**
 * Creates common migration rules for typical field changes
 */
export function createCommonMigrationRules(): FieldMigrationRule[] {
  return [
    // Email field renamed
    {
      from: { name: /^email.*$/i, type: 'email' },
      to: { name: 'work_email', type: 'email' },
    },
    // Phone field renamed
    {
      from: { name: /^phone.*$/i, type: 'phone' },
      to: { name: 'work_phone', type: 'phone' },
    },
    // Text to textarea migration
    {
      from: { type: 'text' },
      to: { name: 'textarea_field', type: 'textarea' },
      transform: (value) => value, // No transformation needed
    },
    // Select to radio migration (for single-select)
    {
      from: { type: 'select' },
      to: { name: 'radio_field', type: 'radio' },
      transform: (value) => Array.isArray(value) ? value[0] : value,
    },
    // Radio to select migration
    {
      from: { type: 'radio' },
      to: { name: 'select_field', type: 'select' },
      transform: (value) => value,
    },
    // Checkbox to radio migration
    {
      from: { type: 'checkbox' },
      to: { name: 'radio_field', type: 'radio' },
      transform: (value: any[]) => Array.isArray(value) ? value[0] : value,
    },
  ];
}

/**
 * Applies schema evolution results to saved form data
 */
export function applySchemaEvolution(
  savedData: SavedFormData,
  evolutionResult: SchemaEvolutionResult
): SavedFormData {
  const updatedFields: SavedFieldValue[] = [
    ...evolutionResult.validFields,
    ...evolutionResult.migratedFields.map(m => m.to),
  ];

  return {
    ...savedData,
    fields: updatedFields.reduce((acc, field) => {
      acc[field.fieldId] = field;
      return acc;
    }, {} as Record<FieldId, SavedFieldValue>),
    savedAt: Date.now(),
  };
}

/**
 * Generates a report of schema changes for debugging/logging
 */
export function generateSchemaEvolutionReport(
  evolutionResult: SchemaEvolutionResult
): string {
  const lines: string[] = [];
  
  lines.push('=== Schema Evolution Report ===');
  lines.push(`Valid fields: ${evolutionResult.validFields.length}`);
  lines.push(`Orphaned fields: ${evolutionResult.orphanedFields.length}`);
  lines.push(`Migrated fields: ${evolutionResult.migratedFields.length}`);
  lines.push('');

  if (evolutionResult.orphanedFields.length > 0) {
    lines.push('Orphaned Fields:');
    evolutionResult.orphanedFields.forEach(field => {
      const metadata = field.metadata;
      lines.push(`  - ${metadata.schemaId}:${metadata.rowId}:${metadata.columnId} (${metadata.type}): "${metadata.label}"`);
    });
    lines.push('');
  }

  if (evolutionResult.migratedFields.length > 0) {
    lines.push('Migrated Fields:');
    evolutionResult.migratedFields.forEach(migration => {
      const fromMetadata = migration.from.metadata;
      const toMetadata = migration.to.metadata;
      lines.push(`  - ${fromMetadata.schemaId}:${fromMetadata.rowId}:${fromMetadata.columnId} → ${toMetadata.schemaId}:${toMetadata.rowId}:${toMetadata.columnId}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}