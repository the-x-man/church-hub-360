import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

// Types for relational tags
export interface RelationalTag {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_required: boolean;
  component_style: 'dropdown' | 'multiselect' | 'checkbox' | 'radio' | 'list' | 'badge';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_updated_by?: string;
}

export interface RelationalTagItem {
  id: string;
  tag_id: string;
  name: string;
  description?: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_updated_by?: string;
}

export interface RelationalTagWithItems extends RelationalTag {
  tag_items: RelationalTagItem[];
}

export interface CreateTagData {
  name: string;
  description?: string;
  is_required?: boolean;
  component_style?: RelationalTag['component_style'];
  display_order?: number;
}

export interface UpdateTagData {
  name?: string;
  description?: string;
  is_required?: boolean;
  component_style?: RelationalTag['component_style'];
  display_order?: number;
  is_active?: boolean;
}

export interface CreateTagItemData {
  name: string;
  description?: string;
  color?: string;
  display_order?: number;
}

export interface UpdateTagItemData {
  name?: string;
  description?: string;
  color?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface BulkCreateTagData {
  name: string;
  description?: string;
  is_required?: boolean;
  component_style?: RelationalTag['component_style'];
  display_order?: number;
  items: CreateTagItemData[];
}

export interface BulkCreateTagsRequest {
  organizationId: string;
  tags: BulkCreateTagData[];
  existingTags: RelationalTagWithItems[];
  userId?: string;
}

// Query Keys
export const relationalTagKeys = {
  all: ['relational-tags'] as const,
  organizationTags: (organizationId: string) => [...relationalTagKeys.all, 'organization', organizationId] as const,
  tag: (tagId: string) => [...relationalTagKeys.all, 'detail', tagId] as const,
};

export interface UseRelationalTagsReturn {
  tags: RelationalTagWithItems[];
  loading: boolean;
  error: string | null;
  
  // Tag operations
  createTag: (data: CreateTagData) => Promise<RelationalTag | null>;
  updateTag: (tagId: string, data: UpdateTagData) => Promise<RelationalTag | null>;
  deleteTag: (tagId: string) => Promise<boolean>;
  reorderTags: (tagIds: string[]) => Promise<boolean>;
  
  // Tag item operations
  createTagItem: (tagId: string, data: CreateTagItemData) => Promise<RelationalTagItem | null>;
  updateTagItem: (itemId: string, data: UpdateTagItemData) => Promise<RelationalTagItem | null>;
  deleteTagItem: (itemId: string) => Promise<boolean>;
  reorderTagItems: (tagId: string, itemIds: string[]) => Promise<boolean>;
  
  // Bulk operations
  bulkCreateTags: (tags: BulkCreateTagData[]) => Promise<RelationalTagWithItems[] | null>;
  
  // Utility functions
  refreshTags: () => Promise<void>;
}

// Hook to fetch tags with items
export function useTagsQuery(organizationId: string | undefined) {
  return useQuery({
    queryKey: relationalTagKeys.organizationTags(organizationId || ''),
    queryFn: async (): Promise<RelationalTagWithItems[]> => {
      if (!organizationId) throw new Error('Organization ID is required');

      // Fetch tags with their items
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select(`
          *,
          tag_items (*)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (tagsError) {
        throw tagsError;
      }

      // Filter and sort tag items
      const processedTags = (tagsData || []).map(tag => ({
        ...tag,
        tag_items: (tag.tag_items || [])
          .filter((item: RelationalTagItem) => item.is_active)
          .sort((a: RelationalTagItem, b: RelationalTagItem) => a.display_order - b.display_order)
      }));

      return processedTags;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to create a new tag
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId: organizationId,
      data,
      existingTags,
      userId,
    }: {
      organizationId: string;
      data: CreateTagData;
      existingTags: RelationalTagWithItems[];
      userId?: string;
    }): Promise<RelationalTag> => {
      // Get the next display order
      const maxOrder = Math.max(...existingTags.map(t => t.display_order), 0);

      const { data: newTag, error: createError } = await supabase
        .from('tags')
        .insert({
          organization_id: organizationId,
          name: data.name,
          description: data.description,
          is_required: data.is_required ?? false,
          component_style: data.component_style ?? 'dropdown',
          display_order: data.display_order ?? maxOrder + 1,
          is_active: true,
          created_by: userId
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return newTag;
    },
    onSuccess: (_, { organizationId }) => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({
        queryKey: relationalTagKeys.organizationTags(organizationId),
      });
    },
  });
}

// Hook to update a tag
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagId,
      organizationId: _organizationId,
      data,
      userId,
    }: {
      tagId: string;
      organizationId: string;
      data: UpdateTagData;
      userId?: string;
    }): Promise<RelationalTag> => {
      const updateData = {
        ...data,
        last_updated_by: userId
      };

      const { data: updatedTag, error: updateError } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', tagId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return updatedTag;
    },
    onSuccess: (_, { organizationId }) => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({
        queryKey: relationalTagKeys.organizationTags(organizationId),
      });
    },
  });
}

// Hook to delete a tag (soft delete)
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagId,
      organizationId: _organizationId,
    }: {
      tagId: string;
      organizationId: string;
    }): Promise<void> => {
      const { error: deleteError } = await supabase
        .from('tags')
        .update({ is_active: false })
        .eq('id', tagId);

      if (deleteError) {
        throw deleteError;
      }
    },
    onSuccess: (_, { organizationId }) => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({
        queryKey: relationalTagKeys.organizationTags(organizationId),
      });
    },
  });
}

// Hook to reorder tags
export function useReorderTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagIds,
      organizationId: _organizationId,
    }: {
      tagIds: string[];
      organizationId: string;
    }): Promise<void> => {
      // Update display_order for each tag
      const updates = tagIds.map((tagId, index) => 
        supabase
          .from('tags')
          .update({ display_order: index + 1 })
          .eq('id', tagId)
      );

      await Promise.all(updates);
    },
    onSuccess: (_, { organizationId }) => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({
        queryKey: relationalTagKeys.organizationTags(organizationId),
      });
    },
  });
}

// Hook to create a new tag item
export function useCreateTagItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagId,
      organizationId: _organizationId,
      data,
      existingItems,
      userId,
    }: {
      tagId: string;
      organizationId: string;
      data: CreateTagItemData;
      existingItems: RelationalTagItem[];
      userId?: string;
    }): Promise<RelationalTagItem> => {
      // Get the next display order for this tag
      const maxOrder = Math.max(...existingItems.map(item => item.display_order), 0);

      const { data: newItem, error: createError } = await supabase
        .from('tag_items')
        .insert({
          tag_id: tagId,
          name: data.name,
          description: data.description,
          color: data.color ?? '#6B7280',
          display_order: data.display_order ?? maxOrder + 1,
          is_active: true,
          created_by: userId
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return newItem;
    },
    onSuccess: (_, { organizationId }) => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({
        queryKey: relationalTagKeys.organizationTags(organizationId),
      });
    },
  });
}

// Hook to update a tag item
export function useUpdateTagItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      organizationId: _organizationId,
      data,
      userId,
    }: {
      itemId: string;
      organizationId: string;
      data: UpdateTagItemData;
      userId?: string;
    }): Promise<RelationalTagItem> => {
      const updateData = {
        ...data,
        last_updated_by: userId
      };

      const { data: updatedItem, error: updateError } = await supabase
        .from('tag_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return updatedItem;
    },
    onSuccess: (_, { organizationId }) => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({
        queryKey: relationalTagKeys.organizationTags(organizationId),
      });
    },
  });
}

// Hook to delete a tag item (soft delete)
export function useDeleteTagItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      organizationId: _organizationId,
    }: {
      itemId: string;
      organizationId: string;
    }): Promise<void> => {
      const { error: deleteError } = await supabase
        .from('tag_items')
        .update({ is_active: false })
        .eq('id', itemId);

      if (deleteError) {
        throw deleteError;
      }
    },
    onSuccess: (_, { organizationId }) => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({
        queryKey: relationalTagKeys.organizationTags(organizationId),
      });
    },
  });
}

// Hook to reorder tag items within a tag
export function useReorderTagItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tagId,
      itemIds,
      organizationId: _organizationId,
    }: {
      tagId: string;
      itemIds: string[];
      organizationId: string;
    }): Promise<void> => {
      // Update display_order for each item
      const updates = itemIds.map((itemId, index) => 
        supabase
          .from('tag_items')
          .update({ display_order: index + 1 })
          .eq('id', itemId)
          .eq('tag_id', tagId)
      );

      await Promise.all(updates);
    },
    onSuccess: (_, { organizationId }) => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({
        queryKey: relationalTagKeys.organizationTags(organizationId),
      });
    },
  });
}

// Hook to bulk create multiple tags with their items
export function useBulkCreateTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      tags,
      existingTags,
      userId,
    }: BulkCreateTagsRequest): Promise<RelationalTagWithItems[]> => {
      const createdTags: RelationalTagWithItems[] = [];
      
      // Get the starting display order
      let maxOrder = Math.max(...existingTags.map(t => t.display_order), 0);

      // Process each tag
      for (const tagData of tags) {
        // Create the tag
        const { data: newTag, error: tagError } = await supabase
          .from('tags')
          .insert({
            organization_id: organizationId,
            name: tagData.name,
            description: tagData.description,
            is_required: tagData.is_required ?? false,
            component_style: tagData.component_style ?? 'dropdown',
            display_order: tagData.display_order ?? ++maxOrder,
            is_active: true,
            created_by: userId
          })
          .select()
          .single();

        if (tagError) {
          throw tagError;
        }

        // Create tag items if any
        const createdItems: RelationalTagItem[] = [];
        if (tagData.items && tagData.items.length > 0) {
          const tagItemsData = tagData.items.map((item, index) => ({
            tag_id: newTag.id,
            name: item.name,
            description: item.description,
            color: item.color ?? '#6B7280',
            display_order: item.display_order ?? index + 1,
            is_active: true,
            created_by: userId
          }));

          const { data: newItems, error: itemsError } = await supabase
            .from('tag_items')
            .insert(tagItemsData)
            .select();

          if (itemsError) {
            throw itemsError;
          }

          createdItems.push(...(newItems || []));
        }

        // Add to created tags with items
        createdTags.push({
          ...newTag,
          tag_items: createdItems
        });
      }

      return createdTags;
    },
    onSuccess: (_, { organizationId }) => {
      // Invalidate and refetch tags
      queryClient.invalidateQueries({
        queryKey: relationalTagKeys.organizationTags(organizationId),
      });
    },
  });
}

export function useRelationalTags(): UseRelationalTagsReturn {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  // Use the query hook to fetch tags
  const {
    data: tags = [],
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useTagsQuery(currentOrganization?.id);

  // Convert query error to string
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load tags') : null;

  // Get mutation hooks
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  const reorderTagsMutation = useReorderTags();
  const createTagItemMutation = useCreateTagItem();
  const updateTagItemMutation = useUpdateTagItem();
  const deleteTagItemMutation = useDeleteTagItem();
  const reorderTagItemsMutation = useReorderTagItems();
  const bulkCreateTagsMutation = useBulkCreateTags();

  // Calculate combined loading state including all mutations
  const loading = queryLoading || 
    createTagMutation.isPending ||
    updateTagMutation.isPending ||
    deleteTagMutation.isPending ||
    reorderTagsMutation.isPending ||
    createTagItemMutation.isPending ||
    updateTagItemMutation.isPending ||
    deleteTagItemMutation.isPending ||
    reorderTagItemsMutation.isPending ||
    bulkCreateTagsMutation.isPending;

  // Wrapper functions to maintain the same API
  const createTag = async (data: CreateTagData): Promise<RelationalTag | null> => {
    if (!currentOrganization?.id) {
      return null;
    }

    try {
      const result = await createTagMutation.mutateAsync({
        organizationId: currentOrganization.id,
        data,
        existingTags: tags,
        userId: user?.id,
      });
      return result;
    } catch (err) {
      console.error('Error creating tag:', err);
      return null;
    }
  };

  const updateTag = async (tagId: string, data: UpdateTagData): Promise<RelationalTag | null> => {
    if (!currentOrganization?.id) {
      return null;
    }

    try {
      const result = await updateTagMutation.mutateAsync({
        tagId,
        organizationId: currentOrganization.id,
        data,
        userId: user?.id,
      });
      return result;
    } catch (err) {
      console.error('Error updating tag:', err);
      return null;
    }
  };

  const deleteTag = async (tagId: string): Promise<boolean> => {
    if (!currentOrganization?.id) {
      return false;
    }

    try {
      await deleteTagMutation.mutateAsync({
        tagId,
        organizationId: currentOrganization.id,
      });
      return true;
    } catch (err) {
      console.error('Error deleting tag:', err);
      return false;
    }
  };

  const reorderTags = async (tagIds: string[]): Promise<boolean> => {
    if (!currentOrganization?.id) {
      return false;
    }

    try {
      await reorderTagsMutation.mutateAsync({
        tagIds,
        organizationId: currentOrganization.id,
      });
      return true;
    } catch (err) {
      console.error('Error reordering tags:', err);
      return false;
    }
  };

  const createTagItem = async (tagId: string, data: CreateTagItemData): Promise<RelationalTagItem | null> => {
    if (!currentOrganization?.id) {
      return null;
    }

    try {
      // Get existing items for this tag
      const tag = tags.find(t => t.id === tagId);
      const existingItems = tag?.tag_items || [];

      const result = await createTagItemMutation.mutateAsync({
        tagId,
        organizationId: currentOrganization.id,
        data,
        existingItems,
        userId: user?.id,
      });
      return result;
    } catch (err) {
      console.error('Error creating tag item:', err);
      return null;
    }
  };

  const updateTagItem = async (itemId: string, data: UpdateTagItemData): Promise<RelationalTagItem | null> => {
    if (!currentOrganization?.id) {
      return null;
    }

    try {
      const result = await updateTagItemMutation.mutateAsync({
        itemId,
        organizationId: currentOrganization.id,
        data,
        userId: user?.id,
      });
      return result;
    } catch (err) {
      console.error('Error updating tag item:', err);
      return null;
    }
  };

  const deleteTagItem = async (itemId: string): Promise<boolean> => {
    if (!currentOrganization?.id) {
      return false;
    }

    try {
      await deleteTagItemMutation.mutateAsync({
        itemId,
        organizationId: currentOrganization.id,
      });
      return true;
    } catch (err) {
      console.error('Error deleting tag item:', err);
      return false;
    }
  };

  const reorderTagItems = async (tagId: string, itemIds: string[]): Promise<boolean> => {
    if (!currentOrganization?.id) {
      return false;
    }

    try {
      await reorderTagItemsMutation.mutateAsync({
        tagId,
        itemIds,
        organizationId: currentOrganization.id,
      });
      return true;
    } catch (err) {
      console.error('Error reordering tag items:', err);
      return false;
    }
  };

  const bulkCreateTags = async (tagsData: BulkCreateTagData[]): Promise<RelationalTagWithItems[] | null> => {
    if (!currentOrganization?.id) {
      return null;
    }

    try {
      const result = await bulkCreateTagsMutation.mutateAsync({
        organizationId: currentOrganization.id,
        tags: tagsData,
        existingTags: tags,
        userId: user?.id,
      });
      return result;
    } catch (err) {
      console.error('Error bulk creating tags:', err);
      return null;
    }
  };

  const refreshTags = async (): Promise<void> => {
    await refetch();
  };

  return {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    reorderTags,
    createTagItem,
    updateTagItem,
    deleteTagItem,
    reorderTagItems,
    bulkCreateTags,
    refreshTags,
  };
}