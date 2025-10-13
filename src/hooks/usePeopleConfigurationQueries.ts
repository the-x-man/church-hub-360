import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import {
  type PeopleConfiguration,
  type CreatePeopleConfigurationRequest,
  type UpdatePeopleConfigurationRequest,
  type MembershipFormSchema,
  type UseMembershipFormManagementReturn,
  type UsePeopleConfigurationReturn,
} from '../types/people-configurations';
import { useState, useCallback } from 'react';

// Query Keys
export const peopleConfigurationKeys = {
  all: ['people-configurations'] as const,
  organization: (organizationId: string) => [...peopleConfigurationKeys.all, 'organization', organizationId] as const,
  configuration: (id: string) => [...peopleConfigurationKeys.all, 'detail', id] as const,
};

// Hook to fetch organization's people configuration
export function usePeopleConfiguration(organizationId: string | undefined): UsePeopleConfigurationReturn {
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: peopleConfigurationKeys.organization(organizationId || ''),
    queryFn: async (): Promise<PeopleConfiguration | null> => {
      if (!organizationId) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('people_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No configuration found, return null
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetch = useCallback(async () => {
    setError(null);
    try {
      await query.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [query]);

  return {
    configuration: query.data || null,
    loading: query.isLoading,
    error: error || (query.error ? query.error.message : null),
    refetch,
  };
}

// Hook to create people configuration
export function useCreatePeopleConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePeopleConfigurationRequest): Promise<PeopleConfiguration> => {
      const { data: result, error } = await supabase
        .from('people_configurations')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      // Invalidate and refetch organization configurations
      queryClient.invalidateQueries({
        queryKey: peopleConfigurationKeys.organization(data.organization_id),
      });
    },
  });
}

// Hook to update people configuration
export function useUpdatePeopleConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePeopleConfigurationRequest;
    }): Promise<PeopleConfiguration> => {
      const { data: result, error } = await supabase
        .from('people_configurations')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      // Invalidate and refetch organization configurations
      queryClient.invalidateQueries({
        queryKey: peopleConfigurationKeys.organization(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: peopleConfigurationKeys.configuration(data.id),
      });
    },
  });
}

// Hook to delete people configuration
export function useDeletePeopleConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('people_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: peopleConfigurationKeys.all,
      });
    },
  });
}


// Comprehensive hook for membership form management
export function useMembershipFormManagement(organizationId: string | undefined): UseMembershipFormManagementReturn {
  const { configuration, loading, error } = usePeopleConfiguration(organizationId);
  const [optimisticMembershipFormSchema, setOptimisticMembershipFormSchema] = useState<MembershipFormSchema | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const queryClient = useQueryClient();

  const membershipFormSchema = optimisticMembershipFormSchema || configuration?.membership_form_schema || null;

  // Helper function to update membership form schema with optimistic updates
  const updateMembershipFormSchema = useCallback(async (newMembershipFormSchema: MembershipFormSchema, skipOptimistic = false) => {
    if (!organizationId) {
      setLocalError('Organization ID is required');
      return;
    }

    try {
      setOperationLoading(true);
      if (!skipOptimistic) {
        setOptimisticMembershipFormSchema(newMembershipFormSchema);
      }

      const { error } = await supabase
        .from('people_configurations')
        .update({
          membership_form_schema: newMembershipFormSchema,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;

      // Update the query cache
      queryClient.setQueryData(['people-configuration', organizationId], (oldData: PeopleConfiguration | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          membership_form_schema: newMembershipFormSchema,
        };
      });

      setOptimisticMembershipFormSchema(null);
      setLocalError(null);
    } catch (err) {
      setOptimisticMembershipFormSchema(null);
      setLocalError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setOperationLoading(false);
    }
  }, [organizationId, queryClient]);

  // Save membership form with form data
  const saveMembershipForm = useCallback(async (formData: any) => {
    const currentSchema = membershipFormSchema || {
      id: `membership-form-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      rows: [],
      is_active: formData.is_active,
      created_date: new Date().toISOString(),
    };

    const updatedSchema: MembershipFormSchema = {
      ...currentSchema,
      name: formData.name,
      description: formData.description,
      is_active: formData.is_active,
      updated_date: new Date().toISOString(),
    };

    await updateMembershipFormSchema(updatedSchema, false);
  }, [membershipFormSchema, updateMembershipFormSchema]);

  // Update form metadata only
  const updateFormMetadata = useCallback(async (metadata: any) => {
    if (!membershipFormSchema) {
      setLocalError('Membership form schema not found');
      return;
    }

    const updatedSchema: MembershipFormSchema = {
      ...membershipFormSchema,
      ...metadata,
      updated_date: new Date().toISOString(),
    };

    await updateMembershipFormSchema(updatedSchema, false);
  }, [membershipFormSchema, updateMembershipFormSchema]);

  return {
    membershipFormSchema,
    loading: loading,
    operationLoading,
    error: localError || error,
    updateMembershipFormSchema,
    saveMembershipForm,
    updateFormMetadata,
  };
}