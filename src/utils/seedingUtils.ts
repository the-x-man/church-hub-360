import { supabase } from './supabase';
// TODO: Update seeding utilities to work with new relational tag system
// import { getDefaultTagsSchema, getMinimalTagsSchema } from './defaultTagsData';
import type { 
  PeopleConfiguration, 
  // TagsSchema, // Removed - using relational tags now
  MembershipFormSchema 
} from '../types/people-configurations';

/**
 * Seeding options for organization initialization
 * TODO: Update to work with relational tag system
 */
export interface SeedingOptions {
  /** Whether to use minimal or full default schema */
  useMinimalSchema?: boolean;
  /** Custom tags schema to override defaults - DEPRECATED: Use relational tags */
  // customTagsSchema?: TagsSchema;
  /** Custom membership form schema */
  customMembershipFormSchema?: MembershipFormSchema;
  /** User ID for audit trail */
  userId?: string;
}

/**
 * Seeds an organization with default people configuration
 * @deprecated This function uses the old JSON-based tag schema. Use relational tag system instead.
 * @param organizationId - The organization ID to seed
 * @param options - Seeding options
 * @returns Promise with the created configuration
 */
export async function seedOrganizationWithDefaults(
  organizationId: string,
  options: SeedingOptions = {}
): Promise<PeopleConfiguration | null> {
  console.warn('seedOrganizationWithDefaults is deprecated. Please use the new relational tag system.');
  
  try {
    const {
      customMembershipFormSchema = {},
      userId
    } = options;

    // TODO: Implement seeding with relational tag system
    // For now, create configuration without tags_schema
    const configurationData = {
      organization_id: organizationId,
      // tags_schema: {}, // Remove tags_schema for now
      membership_form_schema: customMembershipFormSchema,
      created_by: userId,
      last_updated_by: userId,
    };

    // Insert the configuration
    const { data, error } = await supabase
      .from('people_configurations')
      .insert(configurationData)
      .select()
      .single();

    if (error) {
      console.error('Error seeding organization with defaults:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to seed organization:', error);
    throw error;
  }
}

/**
 * Checks if an organization already has people configuration
 * @param organizationId - The organization ID to check
 * @returns Promise with boolean indicating if configuration exists
 */
export async function hasExistingConfiguration(
  organizationId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('people_configurations')
      .select('id')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking existing configuration:', error);
    return false;
  }
}

/**
 * Seeds organization only if it doesn't already have configuration
 * @param organizationId - The organization ID to seed
 * @param options - Seeding options
 * @returns Promise with the configuration (existing or newly created)
 */
export async function seedOrganizationIfNeeded(
  organizationId: string,
  options: SeedingOptions = {}
): Promise<PeopleConfiguration | null> {
  try {
    // Check if configuration already exists
    const hasConfig = await hasExistingConfiguration(organizationId);
    
    if (hasConfig) {
      console.log(`Organization ${organizationId} already has configuration, skipping seeding`);
      
      // Return existing configuration
      const { data } = await supabase
        .from('people_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      
      return data;
    }

    // Seed with defaults
    return await seedOrganizationWithDefaults(organizationId, options);
  } catch (error) {
    console.error('Error in conditional seeding:', error);
    throw error;
  }
}

/**
 * Updates existing organization configuration with new defaults
 * @deprecated This function uses the old JSON-based tag schema. Use relational tag system instead.
 * @param organizationId - The organization ID to update
 * @param options - Update options
 * @returns Promise with the updated configuration
 */
export async function updateOrganizationWithDefaults(
  organizationId: string,
  options: SeedingOptions = {}
): Promise<any> {
  console.warn('updateOrganizationWithDefaults is deprecated. Please use the new relational tag system.');
  
  try {
    const {
      customMembershipFormSchema,
      userId
    } = options;

    // Get current configuration
    const { error: fetchError } = await supabase
      .from('people_configurations')
      .select('id')
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const updateData = {
      ...(customMembershipFormSchema && { membership_form_schema: customMembershipFormSchema }),
      last_updated_by: userId,
    };

    // Update the configuration
    const { data, error } = await supabase
      .from('people_configurations')
      .update(updateData)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating organization with defaults:', error);
    throw error;
  }
}

/**
 * Batch seed multiple organizations with default configurations
 * @param organizationIds - Array of organization IDs to seed
 * @param options - Seeding options (applied to all organizations)
 * @returns Promise with array of results
 */
export async function batchSeedOrganizations(
  organizationIds: string[],
  options: SeedingOptions = {}
): Promise<(PeopleConfiguration | null)[]> {
  try {
    const results = await Promise.allSettled(
      organizationIds.map(orgId => seedOrganizationIfNeeded(orgId, options))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to seed organization ${organizationIds[index]}:`, result.reason);
        return null;
      }
    });
  } catch (error) {
    console.error('Error in batch seeding:', error);
    throw error;
  }
}

/**
 * Validates that a tags schema has the required structure
 * @deprecated This function validates the old JSON-based tag schema. Use relational tag validation instead.
 * @param schema - The schema to validate
 * @returns boolean indicating if schema is valid
 */
export function validateTagsSchema(schema: any): boolean {
  console.warn('validateTagsSchema is deprecated. Please use relational tag validation.');
  
  try {
    return (
      schema &&
      typeof schema === 'object' &&
      schema.categories &&
      typeof schema.categories === 'object' &&
      Object.keys(schema.categories).length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Gets seeding statistics for monitoring purposes
 * @returns Promise with seeding statistics
 */
export async function getSeedingStatistics() {
  try {
    const { data, error } = await supabase
      .from('people_configurations')
      .select('organization_id, created_at, tags_schema')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const stats = {
      totalSeeded: data.length,
      recentlySeeded: data.filter(config => {
        const createdAt = new Date(config.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      }).length,
      categoriesDistribution: {} as Record<string, number>
    };

    // Analyze categories distribution
    data.forEach(config => {
      if (config.tags_schema?.categories) {
        Object.keys(config.tags_schema.categories).forEach(categoryKey => {
          stats.categoriesDistribution[categoryKey] = 
            (stats.categoriesDistribution[categoryKey] || 0) + 1;
        });
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting seeding statistics:', error);
    throw error;
  }
}