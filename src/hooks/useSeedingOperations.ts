import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  seedOrganizationWithDefaults,
  seedOrganizationIfNeeded,
  updateOrganizationWithDefaults,
  hasExistingConfiguration,
  batchSeedOrganizations,
  getSeedingStatistics,
  type SeedingOptions
} from '../utils/seedingUtils';

/**
 * Hook for managing seeding operations
 */
export function useSeedingOperations() {
  const [isSeeding, setIsSeeding] = useState(false);

  // Mutation for seeding a single organization
  const seedOrganizationMutation = useMutation({
    mutationFn: async ({ 
      organizationId, 
      options 
    }: { 
      organizationId: string; 
      options?: SeedingOptions 
    }) => {
      setIsSeeding(true);
      try {
        return await seedOrganizationWithDefaults(organizationId, options);
      } finally {
        setIsSeeding(false);
      }
    },
    onError: (error) => {
      console.error('Seeding failed:', error);
      setIsSeeding(false);
    }
  });

  // Mutation for conditional seeding (only if needed)
  const seedIfNeededMutation = useMutation({
    mutationFn: async ({ 
      organizationId, 
      options 
    }: { 
      organizationId: string; 
      options?: SeedingOptions 
    }) => {
      setIsSeeding(true);
      try {
        return await seedOrganizationIfNeeded(organizationId, options);
      } finally {
        setIsSeeding(false);
      }
    },
    onError: (error) => {
      console.error('Conditional seeding failed:', error);
      setIsSeeding(false);
    }
  });

  // Mutation for updating existing configuration
  const updateConfigurationMutation = useMutation({
    mutationFn: async ({ 
      organizationId, 
      options 
    }: { 
      organizationId: string; 
      options?: SeedingOptions 
    }) => {
      setIsSeeding(true);
      try {
        return await updateOrganizationWithDefaults(organizationId, options);
      } finally {
        setIsSeeding(false);
      }
    },
    onError: (error) => {
      console.error('Configuration update failed:', error);
      setIsSeeding(false);
    }
  });

  // Mutation for batch seeding
  const batchSeedMutation = useMutation({
    mutationFn: async ({ 
      organizationIds, 
      options 
    }: { 
      organizationIds: string[]; 
      options?: SeedingOptions 
    }) => {
      setIsSeeding(true);
      try {
        return await batchSeedOrganizations(organizationIds, options);
      } finally {
        setIsSeeding(false);
      }
    },
    onError: (error) => {
      console.error('Batch seeding failed:', error);
      setIsSeeding(false);
    }
  });

  // Query for checking if organization has configuration
  const useHasConfiguration = (organizationId: string) => {
    return useQuery({
      queryKey: ['hasConfiguration', organizationId],
      queryFn: () => hasExistingConfiguration(organizationId),
      enabled: !!organizationId,
    });
  };

  // Query for seeding statistics
  const useSeedingStats = () => {
    return useQuery({
      queryKey: ['seedingStats'],
      queryFn: getSeedingStatistics,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Convenience functions
  const seedOrganization = useCallback(
    (organizationId: string, options?: SeedingOptions) => {
      return seedOrganizationMutation.mutateAsync({ organizationId, options });
    },
    [seedOrganizationMutation]
  );

  const seedIfNeeded = useCallback(
    (organizationId: string, options?: SeedingOptions) => {
      return seedIfNeededMutation.mutateAsync({ organizationId, options });
    },
    [seedIfNeededMutation]
  );

  const updateConfiguration = useCallback(
    (organizationId: string, options?: SeedingOptions) => {
      return updateConfigurationMutation.mutateAsync({ organizationId, options });
    },
    [updateConfigurationMutation]
  );

  const batchSeed = useCallback(
    (organizationIds: string[], options?: SeedingOptions) => {
      return batchSeedMutation.mutateAsync({ organizationIds, options });
    },
    [batchSeedMutation]
  );

  return {
    // State
    isSeeding,
    
    // Mutations
    seedOrganization,
    seedIfNeeded,
    updateConfiguration,
    batchSeed,
    
    // Mutation objects (for accessing loading states, errors, etc.)
    seedOrganizationMutation,
    seedIfNeededMutation,
    updateConfigurationMutation,
    batchSeedMutation,
    
    // Queries
    useHasConfiguration,
    useSeedingStats,
  };
}

/**
 * Hook for seeding operations with specific organization context
 */
export function useOrganizationSeeding(organizationId: string) {
  const seedingOps = useSeedingOperations();
  const hasConfigQuery = seedingOps.useHasConfiguration(organizationId);

  const seedThisOrganization = useCallback(
    (options?: SeedingOptions) => {
      return seedingOps.seedOrganization(organizationId, options);
    },
    [seedingOps, organizationId]
  );

  const seedThisOrganizationIfNeeded = useCallback(
    (options?: SeedingOptions) => {
      return seedingOps.seedIfNeeded(organizationId, options);
    },
    [seedingOps, organizationId]
  );

  const updateThisOrganization = useCallback(
    (options?: SeedingOptions) => {
      return seedingOps.updateConfiguration(organizationId, options);
    },
    [seedingOps, organizationId]
  );

  return {
    ...seedingOps,
    organizationId,
    hasConfiguration: hasConfigQuery.data ?? false,
    isCheckingConfiguration: hasConfigQuery.isLoading,
    configurationError: hasConfigQuery.error,
    seedThisOrganization,
    seedThisOrganizationIfNeeded,
    updateThisOrganization,
    refetchHasConfiguration: hasConfigQuery.refetch,
  };
}

/**
 * Hook for seeding statistics and monitoring
 */
export function useSeedingMonitoring() {
  const { useSeedingStats } = useSeedingOperations();
  const statsQuery = useSeedingStats();

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    statsError: statsQuery.error,
    refetchStats: statsQuery.refetch,
  };
}