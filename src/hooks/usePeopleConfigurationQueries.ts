import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type {
  PeopleConfiguration,
  CreatePeopleConfigurationRequest,
  UpdatePeopleConfigurationRequest,
  UsePeopleConfigurationReturn,
  CommitteesSchema,
  Committee,
  CommitteeFormData,
  UseCommitteesManagementReturn,
  MembershipFormSchema,
  MembershipFormData,
  UseMembershipFormManagementReturn,
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


// Comprehensive hook for committees management
export function useCommitteesManagement(organizationId: string | undefined): UseCommitteesManagementReturn {
  const [error, setError] = useState<string | null>(null);
  const [optimisticCommitteesSchema, setOptimisticCommitteesSchema] = useState<CommitteesSchema | null>(null);
  const { configuration, loading, refetch } = usePeopleConfiguration(organizationId);
  const updateConfiguration = useUpdatePeopleConfiguration();
  const createConfiguration = useCreatePeopleConfiguration();

  const committeesSchema = optimisticCommitteesSchema || configuration?.committees_schema || null;

  // Helper function to update committees schema with optimistic updates
  const updateCommitteesSchema = useCallback(async (newCommitteesSchema: CommitteesSchema, skipOptimistic = false) => {
    if (!organizationId) {
      setError('Organization ID is required');
      return;
    }

    try {
      setError(null);
      
      // Apply optimistic update immediately (unless skipped for initial creation)
      if (!skipOptimistic) {
        setOptimisticCommitteesSchema(newCommitteesSchema);
      }
      
      if (configuration) {
        // Update existing configuration
        await updateConfiguration.mutateAsync({
          id: configuration.id,
          data: { committees_schema: newCommitteesSchema },
        });
      } else {
        // Create new configuration
        await createConfiguration.mutateAsync({
          organization_id: organizationId,
          committees_schema: newCommitteesSchema,
        });
      }
      
      // Refetch to sync with server, but don't wait for it
      refetch().then(() => {
        // Clear optimistic state once server data is loaded
        setOptimisticCommitteesSchema(null);
      });
    } catch (err) {
      // Revert optimistic update on error
      setOptimisticCommitteesSchema(null);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, [organizationId, configuration, updateConfiguration, createConfiguration, refetch]);

  // Committee management functions
  const createCommittee = useCallback(async (committeeKey: string, committee: CommitteeFormData) => {
    if (!committeesSchema) {
      // Create initial schema if it doesn't exist
      const newCommittee: Committee = {
        ...committee,
        members: [],
        positions: [],
        created_date: new Date().toISOString(),
      };

      const newSchema: CommitteesSchema = {
        committees: {
          [committeeKey]: newCommittee,
        },
      };

      await updateCommitteesSchema(newSchema, false);
      return;
    }

    const newCommittee: Committee = {
      ...committee,
      members: [],
      positions: [],
      created_date: new Date().toISOString(),
    };

    const updatedSchema: CommitteesSchema = {
      committees: {
        ...committeesSchema.committees,
        [committeeKey]: newCommittee,
      },
    };

    await updateCommitteesSchema(updatedSchema, false);
  }, [committeesSchema, updateCommitteesSchema]);

  const updateCommittee = useCallback(async (committeeKey: string, committeeUpdates: Partial<Committee>) => {
    if (!committeesSchema?.committees[committeeKey]) {
      setError('Committee not found');
      return;
    }

    const updatedCommittee: Committee = {
      ...committeesSchema.committees[committeeKey],
      ...committeeUpdates,
    };

    const updatedSchema: CommitteesSchema = {
      committees: {
        ...committeesSchema.committees,
        [committeeKey]: updatedCommittee,
      },
    };

    await updateCommitteesSchema(updatedSchema, false);
  }, [committeesSchema, updateCommitteesSchema]);

  const deleteCommittee = useCallback(async (committeeKey: string) => {
    if (!committeesSchema?.committees[committeeKey]) {
      setError('Committee not found');
      return;
    }

    const { [committeeKey]: deletedCommittee, ...remainingCommittees } = committeesSchema.committees;

    const updatedSchema: CommitteesSchema = {
      committees: remainingCommittees,
    };

    await updateCommitteesSchema(updatedSchema, false);
  }, [committeesSchema, updateCommitteesSchema]);

  const addMember = useCallback(async (committeeKey: string, memberId: string) => {
    if (!committeesSchema?.committees[committeeKey]) {
      setError('Committee not found');
      return;
    }

    const committee = committeesSchema.committees[committeeKey];
    if (committee.members.includes(memberId)) {
      setError('Member already in committee');
      return;
    }

    const updatedCommittee: Committee = {
      ...committee,
      members: [...committee.members, memberId],
    };

    const updatedSchema: CommitteesSchema = {
      committees: {
        ...committeesSchema.committees,
        [committeeKey]: updatedCommittee,
      },
    };

    await updateCommitteesSchema(updatedSchema, false);
  }, [committeesSchema, updateCommitteesSchema]);

  const removeMember = useCallback(async (committeeKey: string, memberId: string) => {
    if (!committeesSchema?.committees[committeeKey]) {
      setError('Committee not found');
      return;
    }

    const committee = committeesSchema.committees[committeeKey];
    const updatedMembers = committee.members.filter(id => id !== memberId);

    const updatedCommittee: Committee = {
      ...committee,
      members: updatedMembers,
    };

    const updatedSchema: CommitteesSchema = {
      committees: {
        ...committeesSchema.committees,
        [committeeKey]: updatedCommittee,
      },
    };

    await updateCommitteesSchema(updatedSchema, false);
  }, [committeesSchema, updateCommitteesSchema]);

  return {
    committeesSchema,
    loading: loading,
    operationLoading: updateConfiguration.isPending || createConfiguration.isPending,
    error: error || (updateConfiguration.error ? updateConfiguration.error.message : null) || (createConfiguration.error ? createConfiguration.error.message : null),
    updateCommitteesSchema,
    createCommittee,
    updateCommittee,
    deleteCommittee,
    addMember,
    removeMember,
  };
}

// Comprehensive hook for membership form management
export function useMembershipFormManagement(organizationId: string | undefined): UseMembershipFormManagementReturn {
  const [error, setError] = useState<string | null>(null);
  const [optimisticMembershipFormSchema, setOptimisticMembershipFormSchema] = useState<MembershipFormSchema | null>(null);
  const { configuration, loading, refetch } = usePeopleConfiguration(organizationId);
  const updateConfiguration = useUpdatePeopleConfiguration();
  const createConfiguration = useCreatePeopleConfiguration();

  const membershipFormSchema = optimisticMembershipFormSchema || configuration?.membership_form_schema || null;

  // Helper function to update membership form schema with optimistic updates
  const updateMembershipFormSchema = useCallback(async (newMembershipFormSchema: MembershipFormSchema, skipOptimistic = false) => {
    if (!organizationId) {
      setError('Organization ID is required');
      return;
    }

    try {
      setError(null);
      
      // Apply optimistic update immediately (unless skipped for initial creation)
      if (!skipOptimistic) {
        setOptimisticMembershipFormSchema(newMembershipFormSchema);
      }
      
      if (configuration) {
        // Update existing configuration
        await updateConfiguration.mutateAsync({
          id: configuration.id,
          data: { membership_form_schema: newMembershipFormSchema },
        });
      } else {
        // Create new configuration
        await createConfiguration.mutateAsync({
          organization_id: organizationId,
          membership_form_schema: newMembershipFormSchema,
        });
      }
      
      // Refetch to sync with server, but don't wait for it
      refetch().then(() => {
        // Clear optimistic state once server data is loaded
        setOptimisticMembershipFormSchema(null);
      });
    } catch (err) {
      // Revert optimistic update on error
      setOptimisticMembershipFormSchema(null);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, [organizationId, configuration, updateConfiguration, createConfiguration, refetch]);

  // Save membership form with form data
  const saveMembershipForm = useCallback(async (formData: MembershipFormData) => {
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
  const updateFormMetadata = useCallback(async (metadata: Partial<MembershipFormData>) => {
    if (!membershipFormSchema) {
      setError('Membership form schema not found');
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
    operationLoading: updateConfiguration.isPending || createConfiguration.isPending,
    error: error || (updateConfiguration.error ? updateConfiguration.error.message : null) || (createConfiguration.error ? createConfiguration.error.message : null),
    updateMembershipFormSchema,
    saveMembershipForm,
    updateFormMetadata,
  };
}