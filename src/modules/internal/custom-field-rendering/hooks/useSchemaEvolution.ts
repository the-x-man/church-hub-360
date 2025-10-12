import { useMemo, useCallback, useState } from 'react';
import type { 
  SavedFormData
} from '../types';
import type { MembershipFormSchema } from '@/types/people-configurations';
import { 
  analyzeSchemaEvolution, 
  applySchemaEvolution, 
  generateSchemaEvolutionReport,
  createCommonMigrationRules,
  DEFAULT_SCHEMA_EVOLUTION_CONFIG 
} from '../utils/schema-evolution';
import type {
  SchemaEvolutionResult,
  SchemaEvolutionConfig,
  FieldMigrationRule
} from '../utils/schema-evolution';

/**
 * Configuration for schema evolution hook
 */
export interface UseSchemaEvolutionConfig extends SchemaEvolutionConfig {
  /** Whether to automatically apply migrations */
  autoApplyMigrations: boolean;
  /** Whether to log evolution reports to console */
  logReports: boolean;
}

/**
 * Result of schema evolution hook
 */
export interface UseSchemaEvolutionResult {
  /** Evolution analysis result */
  evolutionResult: SchemaEvolutionResult;
  /** Migrated form data (if auto-apply is enabled) */
  migratedData: SavedFormData | null;
  /** Whether migration is in progress */
  isMigrating: boolean;
  /** Migration report for debugging */
  migrationReport: string;
  /** Statistics about the evolution */
  stats: {
    totalFields: number;
    validFields: number;
    orphanedFields: number;
    migratedFields: number;
    migrationSuccess: boolean;
  };
  /** Manually apply migrations */
  applyMigrations: () => SavedFormData | null;
  /** Get evolution report */
  getEvolutionReport: () => string;
  /** Add custom migration rule */
  addMigrationRule: (rule: FieldMigrationRule) => void;
  /** Remove migration rule */
  removeMigrationRule: (index: number) => void;
  /** Reset to original data */
  resetToOriginal: () => void;
}

/**
 * Default configuration for schema evolution hook
 */
const DEFAULT_CONFIG: UseSchemaEvolutionConfig = {
  ...DEFAULT_SCHEMA_EVOLUTION_CONFIG,
  autoApplyMigrations: true,
  logReports: false,
};

/**
 * Hook for handling schema evolution and field migration
 */
export function useSchemaEvolution(
  savedData: SavedFormData | null,
  schema: MembershipFormSchema,
  config: UseSchemaEvolutionConfig = DEFAULT_CONFIG
): UseSchemaEvolutionResult {
  const [customMigrationRules, setCustomMigrationRules] = useState<FieldMigrationRule[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);

  // Combine default and custom migration rules
  const allMigrationRules = useMemo(() => {
    const commonRules = createCommonMigrationRules();
    return [...commonRules, ...customMigrationRules];
  }, [customMigrationRules]);

  // Analyze schema evolution
  const evolutionResult = useMemo(() => {
    if (!savedData || !schema.rows?.length) {
      return {
        changes: [],
        orphanedFields: [],
        migratedFields: [],
        validFields: [],
      };
    }

    const evolutionConfig: SchemaEvolutionConfig = {
      trackChanges: config.trackChanges,
      orphanedFieldMaxAge: config.orphanedFieldMaxAge,
      autoMigrate: config.autoMigrate,
      migrationRules: allMigrationRules,
    };

    return analyzeSchemaEvolution(savedData, schema, evolutionConfig);
  }, [savedData, schema, config, allMigrationRules]);

  // Apply migrations automatically if enabled
  const migratedData = useMemo(() => {
    if (!config.autoApplyMigrations || !savedData) {
      return null;
    }

    if (evolutionResult.migratedFields.length === 0 && evolutionResult.orphanedFields.length === 0) {
      return savedData; // No changes needed
    }

    return applySchemaEvolution(savedData, evolutionResult);
  }, [config.autoApplyMigrations, savedData, evolutionResult]);

  // Generate migration report
  const migrationReport = useMemo(() => {
    const report = generateSchemaEvolutionReport(evolutionResult);
    
    if (config.logReports && report.trim() !== '=== Schema Evolution Report ===\nValid fields: 0\nOrphaned fields: 0\nMigrated fields: 0') {
      console.log(report);
    }
    
    return report;
  }, [evolutionResult, config.logReports]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalFields = savedData?.fields ? Object.keys(savedData.fields).length : 0;
    const validFields = evolutionResult.validFields.length;
    const orphanedFields = evolutionResult.orphanedFields.length;
    const migratedFields = evolutionResult.migratedFields.length;
    const migrationSuccess = migratedFields > 0 || (orphanedFields === 0 && validFields === totalFields);

    return {
      totalFields,
      validFields,
      orphanedFields,
      migratedFields,
      migrationSuccess,
    };
  }, [savedData, evolutionResult]);

  // Manually apply migrations
  const applyMigrations = useCallback((): SavedFormData | null => {
    if (!savedData) return null;

    setIsMigrating(true);
    
    try {
      const result = applySchemaEvolution(savedData, evolutionResult);
      return result;
    } finally {
      setIsMigrating(false);
    }
  }, [savedData, evolutionResult]);

  // Get evolution report
  const getEvolutionReport = useCallback(() => {
    return migrationReport;
  }, [migrationReport]);

  // Add custom migration rule
  const addMigrationRule = useCallback((rule: FieldMigrationRule) => {
    setCustomMigrationRules(prev => [...prev, rule]);
  }, []);

  // Remove migration rule
  const removeMigrationRule = useCallback((index: number) => {
    setCustomMigrationRules(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Reset to original data
  const resetToOriginal = useCallback(() => {
    setCustomMigrationRules([]);
  }, []);

  return {
    evolutionResult,
    migratedData,
    isMigrating,
    migrationReport,
    stats,
    applyMigrations,
    getEvolutionReport,
    addMigrationRule,
    removeMigrationRule,
    resetToOriginal,
  };
}