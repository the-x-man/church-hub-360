import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type {
  PeopleConfiguration,
  CreatePeopleConfigurationRequest,
  UpdatePeopleConfigurationRequest,
  TagsSchema,
  TagCategory,
  TagItem,
  TagCategoryFormData,
  TagItemFormData,
  UsePeopleConfigurationReturn,
  UseTagsManagementReturn,
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

// Comprehensive hook for tags management
export function useTagsManagement(organizationId: string | undefined): UseTagsManagementReturn {
  const [error, setError] = useState<string | null>(null);
  const [optimisticTagsSchema, setOptimisticTagsSchema] = useState<TagsSchema | null>(null);
  const { configuration, loading, refetch } = usePeopleConfiguration(organizationId);
  const updateConfiguration = useUpdatePeopleConfiguration();
  const createConfiguration = useCreatePeopleConfiguration();

  const tagsSchema = optimisticTagsSchema || configuration?.tags_schema || null;

  // Helper function to update tags schema with optimistic updates
  const updateTagsSchema = useCallback(async (newTagsSchema: TagsSchema, skipOptimistic = false) => {
    if (!organizationId) {
      setError('Organization ID is required');
      return;
    }

    try {
      setError(null);
      
      // Apply optimistic update immediately (unless skipped for initial creation)
      if (!skipOptimistic) {
        setOptimisticTagsSchema(newTagsSchema);
      }
      
      if (configuration) {
        // Update existing configuration
        await updateConfiguration.mutateAsync({
          id: configuration.id,
          data: { tags_schema: newTagsSchema },
        });
      } else {
        // Create new configuration
        await createConfiguration.mutateAsync({
          organization_id: organizationId,
          tags_schema: newTagsSchema,
        });
      }
      
      // Refetch to sync with server, but don't wait for it
      refetch().then(() => {
        // Clear optimistic state once server data is loaded
        setOptimisticTagsSchema(null);
      });
    } catch (err) {
      // Revert optimistic update on error
      setOptimisticTagsSchema(null);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, [organizationId, configuration, updateConfiguration, createConfiguration, refetch]);

  // Category management functions
  const createCategory = useCallback(async (categoryKey: string, category: TagCategoryFormData) => {
    if (!tagsSchema) {
      setError('Tags schema not found');
      return;
    }

    const newCategory: TagCategory = {
      ...category,
      items: [],
    };

    const updatedSchema: TagsSchema = {
      categories: {
        ...tagsSchema.categories,
        [categoryKey]: newCategory,
      },
    };

    await updateTagsSchema(updatedSchema, false); // Use optimistic updates
  }, [tagsSchema, updateTagsSchema]);

  const updateCategory = useCallback(async (categoryKey: string, categoryUpdates: Partial<TagCategoryFormData>) => {
    if (!tagsSchema?.categories[categoryKey]) {
      setError('Category not found');
      return;
    }

    const updatedCategory: TagCategory = {
      ...tagsSchema.categories[categoryKey],
      ...categoryUpdates,
    };

    const updatedSchema: TagsSchema = {
      categories: {
        ...tagsSchema.categories,
        [categoryKey]: updatedCategory,
      },
    };

    await updateTagsSchema(updatedSchema, false); // Use optimistic updates
  }, [tagsSchema, updateTagsSchema]);

  const deleteCategory = useCallback(async (categoryKey: string) => {
    if (!tagsSchema?.categories[categoryKey]) {
      setError('Category not found');
      return;
    }

    const { [categoryKey]: deletedCategory, ...remainingCategories } = tagsSchema.categories;

    const updatedSchema: TagsSchema = {
      categories: remainingCategories,
    };

    await updateTagsSchema(updatedSchema, false); // Use optimistic updates
  }, [tagsSchema, updateTagsSchema]);

  // Tag item management functions
  const createTagItem = useCallback(async (categoryKey: string, item: TagItemFormData) => {
    if (!tagsSchema?.categories[categoryKey]) {
      setError('Category not found');
      return;
    }

    const newItem: TagItem = {
      id: `${categoryKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...item,
    };

    const updatedCategory: TagCategory = {
      ...tagsSchema.categories[categoryKey],
      items: [...tagsSchema.categories[categoryKey].items, newItem],
    };

    const updatedSchema: TagsSchema = {
      categories: {
        ...tagsSchema.categories,
        [categoryKey]: updatedCategory,
      },
    };

    await updateTagsSchema(updatedSchema, false); // Use optimistic updates
  }, [tagsSchema, updateTagsSchema]);

  const updateTagItem = useCallback(async (categoryKey: string, itemId: string, itemUpdates: Partial<TagItemFormData>) => {
    if (!tagsSchema?.categories[categoryKey]) {
      setError('Category not found');
      return;
    }

    const category = tagsSchema.categories[categoryKey];
    const itemIndex = category.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      setError('Tag item not found');
      return;
    }

    const updatedItems = [...category.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      ...itemUpdates,
    };

    const updatedCategory: TagCategory = {
      ...category,
      items: updatedItems,
    };

    const updatedSchema: TagsSchema = {
      categories: {
        ...tagsSchema.categories,
        [categoryKey]: updatedCategory,
      },
    };

    await updateTagsSchema(updatedSchema, false); // Use optimistic updates
  }, [tagsSchema, updateTagsSchema]);

  const deleteTagItem = useCallback(async (categoryKey: string, itemId: string) => {
    if (!tagsSchema?.categories[categoryKey]) {
      setError('Category not found');
      return;
    }

    const category = tagsSchema.categories[categoryKey];
    const updatedItems = category.items.filter(item => item.id !== itemId);

    const updatedCategory: TagCategory = {
      ...category,
      items: updatedItems,
    };

    const updatedSchema: TagsSchema = {
      categories: {
        ...tagsSchema.categories,
        [categoryKey]: updatedCategory,
      },
    };

    await updateTagsSchema(updatedSchema, false); // Use optimistic updates
  }, [tagsSchema, updateTagsSchema]);

  // Reordering functions
  const reorderCategories = useCallback(async (categoryKeys: string[]) => {
    if (!tagsSchema) {
      setError('Tags schema not found');
      return;
    }

    const reorderedCategories: { [key: string]: TagCategory } = {};
    
    categoryKeys.forEach((key, index) => {
      if (tagsSchema.categories[key]) {
        reorderedCategories[key] = {
          ...tagsSchema.categories[key],
          display_order: index + 1,
        };
      }
    });

    const updatedSchema: TagsSchema = {
      categories: reorderedCategories,
    };

    await updateTagsSchema(updatedSchema);
  }, [tagsSchema, updateTagsSchema]);

  const reorderTagItems = useCallback(async (categoryKey: string, itemIds: string[]) => {
    if (!tagsSchema?.categories[categoryKey]) {
      setError('Category not found');
      return;
    }

    const category = tagsSchema.categories[categoryKey];
    const reorderedItems: TagItem[] = [];

    itemIds.forEach((itemId, index) => {
      const item = category.items.find(item => item.id === itemId);
      if (item) {
        reorderedItems.push({
          ...item,
          display_order: index + 1,
        });
      }
    });

    const updatedCategory: TagCategory = {
      ...category,
      items: reorderedItems,
    };

    const updatedSchema: TagsSchema = {
      categories: {
        ...tagsSchema.categories,
        [categoryKey]: updatedCategory,
      },
    };

    await updateTagsSchema(updatedSchema);
  }, [tagsSchema, updateTagsSchema]);

  return {
    tagsSchema,
    loading: loading, // Only initial loading, not operation loading
    operationLoading: updateConfiguration.isPending || createConfiguration.isPending,
    error: error || (updateConfiguration.error ? updateConfiguration.error.message : null) || (createConfiguration.error ? createConfiguration.error.message : null),
    createCategory,
    updateCategory,
    deleteCategory,
    createTagItem,
    updateTagItem,
    deleteTagItem,
    reorderCategories,
    reorderTagItems,
  };
}