import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTagsManagement } from './usePeopleConfigurationQueries';
import { detectSchemaChanges, hasSchemaChanges, type SchemaChanges } from '../utils/schema-change-detection';
import { validateTagsSchema } from '../utils/people-configurations-validation';
import type { TagsSchema, TagCategory, TagItem } from '../types/people-configurations';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface LocalTagsSchemaState {
  // Local state
  localSchema: TagsSchema | null;
  originalSchema: TagsSchema | null;
  
  // Change detection
  hasUnsavedChanges: boolean;
  changes: SchemaChanges;
  
  // Actions
  updateLocalSchema: (schema: TagsSchema) => void;
  resetLocalChanges: () => void;
  syncChangesToServer: () => Promise<void>;
  
  // Category management
  addCategory: (category: Omit<TagCategory, 'items'> | TagCategory) => void;
  addCategoryWithKey: (categoryKey: string, category: TagCategory) => void;
  addMultipleCategories: (categories: Record<string, TagCategory>) => void;
  updateCategory: (categoryKey: string, updates: Partial<TagCategory>) => void;
  deleteCategory: (categoryKey: string) => void;
  
  // Item management
  addItem: (categoryKey: string, item: Omit<TagItem, 'id'>) => void;
  updateItem: (categoryKey: string, itemId: string, updates: Partial<TagItem>) => void;
  deleteItem: (categoryKey: string, itemId: string) => void;
  
  // State from original hook
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
}

/**
 * Custom hook for managing local tags schema state with change detection
 * Builds upon the existing useTagsManagement hook to provide local state management
 */
export function useLocalTagsSchema(): LocalTagsSchemaState {
  const {currentOrganization } = useOrganization()
  const {
    tagsSchema: serverSchema,
    loading: isLoading,
    operationLoading: isUpdating,
    error,
    updateTagsSchema,
  } = useTagsManagement(currentOrganization?.id);

  // Local state for the schema
  const [localSchema, setLocalSchema] = useState<TagsSchema | null>(null);
  const [originalSchema, setOriginalSchema] = useState<TagsSchema | null>(null);

  // Initialize local state when server data loads
  useEffect(() => {
    if (serverSchema && !localSchema) {
      const schemaCopy = JSON.parse(JSON.stringify(serverSchema));
      setLocalSchema(schemaCopy);
      setOriginalSchema(schemaCopy);
    }
  }, [serverSchema, localSchema]);

  // Reset local state when server schema changes (e.g., after successful update)
  useEffect(() => {
    if (serverSchema && originalSchema && !isUpdating) {
      // Only reset if the server schema is different from our original
      if (JSON.stringify(serverSchema) !== JSON.stringify(originalSchema)) {
        const schemaCopy = JSON.parse(JSON.stringify(serverSchema));
        setLocalSchema(schemaCopy);
        setOriginalSchema(schemaCopy);
      }
    }
  }, [serverSchema, originalSchema, isUpdating]);

  // Memoized change detection
  const changes = useMemo(() => {
    return detectSchemaChanges(originalSchema, localSchema);
  }, [originalSchema, localSchema]);

  const hasUnsavedChanges = useMemo(() => {
    return hasSchemaChanges(originalSchema, localSchema);
  }, [originalSchema, localSchema]);

  // Update local schema
  const updateLocalSchema = useCallback((schema: TagsSchema) => {
    setLocalSchema(JSON.parse(JSON.stringify(schema)));
  }, []);

  // Reset local changes
  const resetLocalChanges = useCallback(() => {
    if (originalSchema) {
      setLocalSchema(JSON.parse(JSON.stringify(originalSchema)));
    }
  }, [originalSchema]);

  // Sync changes to server
  const syncChangesToServer = useCallback(async () => {
    if (!localSchema || !hasUnsavedChanges) return;

    // Validate schema before syncing
    const validationResult = validateTagsSchema(localSchema);
    if (!validationResult.isValid) {
      const error = new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      error.name = 'ValidationError';
      throw error;
    }

    try {
      await updateTagsSchema(localSchema);
      // The useEffect above will handle resetting the local state after successful update
    } catch (error) {
      // Error is handled by the original hook
      throw error;
    }
  }, [localSchema, hasUnsavedChanges, updateTagsSchema]);

  // Helper function to generate unique IDs
  const generateId = useCallback(() => {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Category management functions
  const addCategory = useCallback((categoryData: Omit<TagCategory, 'items'> | TagCategory) => {
    if (!localSchema) return;

    // Check if categoryData has items (template) or not (new blank tag)
    const hasItems = 'items' in categoryData && Array.isArray(categoryData.items);
    
    const newCategory: TagCategory = {
      ...categoryData,
      items: hasItems 
        ? categoryData.items.map(item => ({
            ...item,
            id: generateId(),
          }))
        : [],
    };

    const categoryKey = newCategory.name.toLowerCase().replace(/\s+/g, '_');
    
    const updatedSchema = {
      ...localSchema,
      categories: {
        ...localSchema.categories,
        [categoryKey]: newCategory,
      },
    };

    setLocalSchema(updatedSchema);
  }, [localSchema, generateId]);

  const addCategoryWithKey = useCallback((categoryKey: string, categoryData: TagCategory) => {
    if (!localSchema) return;

    // Generate new IDs for all items to avoid conflicts
    const newCategory: TagCategory = {
      ...categoryData,
      items: categoryData.items.map(item => ({
        ...item,
        id: generateId(),
      })),
    };
    
    const updatedSchema = {
      ...localSchema,
      categories: {
        ...localSchema.categories,
        [categoryKey]: newCategory,
      },
    };

    setLocalSchema(updatedSchema);
  }, [localSchema, generateId]);

  const addMultipleCategories = useCallback((categories: Record<string, TagCategory>) => {
    if (!localSchema) return;

    // Process all categories and generate new IDs for their items
    const processedCategories: Record<string, TagCategory> = {};
    
    Object.entries(categories).forEach(([categoryKey, categoryData]) => {
      processedCategories[categoryKey] = {
        ...categoryData,
        items: categoryData.items.map(item => ({
          ...item,
          id: generateId(),
        })),
      };
    });
    
    const updatedSchema = {
      ...localSchema,
      categories: {
        ...localSchema.categories,
        ...processedCategories,
      },
    };

    setLocalSchema(updatedSchema);
  }, [localSchema, generateId]);

  const updateCategory = useCallback((categoryKey: string, updates: Partial<TagCategory>) => {
    if (!localSchema || !localSchema.categories[categoryKey]) return;

    const updatedSchema = {
      ...localSchema,
      categories: {
        ...localSchema.categories,
        [categoryKey]: {
          ...localSchema.categories[categoryKey],
          ...updates,
        },
      },
    };

    setLocalSchema(updatedSchema);
  }, [localSchema]);

  const deleteCategory = useCallback((categoryKey: string) => {
    if (!localSchema || !localSchema.categories[categoryKey]) return;

    const { [categoryKey]: deletedCategory, ...remainingCategories } = localSchema.categories;
    
    const updatedSchema = {
      ...localSchema,
      categories: remainingCategories,
    };

    setLocalSchema(updatedSchema);
  }, [localSchema]);

  // Item management functions
  const addItem = useCallback((categoryKey: string, itemData: Omit<TagItem, 'id'>) => {
    if (!localSchema || !localSchema.categories[categoryKey]) return;

    const newItem: TagItem = {
      ...itemData,
      id: generateId(),
    };

    const category = localSchema.categories[categoryKey];
    const updatedCategory = {
      ...category,
      items: [...category.items, newItem],
    };

    const updatedSchema = {
      ...localSchema,
      categories: {
        ...localSchema.categories,
        [categoryKey]: updatedCategory,
      },
    };

    setLocalSchema(updatedSchema);
  }, [localSchema, generateId]);

  const updateItem = useCallback((categoryKey: string, itemId: string, updates: Partial<TagItem>) => {
    if (!localSchema || !localSchema.categories[categoryKey]) return;

    const category = localSchema.categories[categoryKey];
    const itemIndex = category.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return;

    const updatedItems = [...category.items];
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updates };

    const updatedCategory = {
      ...category,
      items: updatedItems,
    };

    const updatedSchema = {
      ...localSchema,
      categories: {
        ...localSchema.categories,
        [categoryKey]: updatedCategory,
      },
    };

    setLocalSchema(updatedSchema);
  }, [localSchema]);

  const deleteItem = useCallback((categoryKey: string, itemId: string) => {
    if (!localSchema || !localSchema.categories[categoryKey]) return;

    const category = localSchema.categories[categoryKey];
    const updatedItems = category.items.filter(item => item.id !== itemId);

    const updatedCategory = {
      ...category,
      items: updatedItems,
    };

    const updatedSchema = {
      ...localSchema,
      categories: {
        ...localSchema.categories,
        [categoryKey]: updatedCategory,
      },
    };

    setLocalSchema(updatedSchema);
  }, [localSchema]);

  return {
    // Local state
    localSchema,
    originalSchema,
    
    // Change detection
    hasUnsavedChanges,
    changes,
    
    // Actions
    updateLocalSchema,
    resetLocalChanges,
    syncChangesToServer,
    
    // Category management
    addCategory,
    addCategoryWithKey,
    addMultipleCategories,
    updateCategory,
    deleteCategory,
    
    // Item management
    addItem,
    updateItem,
    deleteItem,
    
    // State from original hook
    isLoading,
    error,
    isUpdating,
  };
}