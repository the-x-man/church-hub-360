import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCommitteesManagement } from './usePeopleConfigurationQueries';
import type { CommitteesSchema, Committee, CommitteeFormData } from '../types/people-configurations';
import { useOrganization } from '@/contexts/OrganizationContext';

// Define SchemaChanges type inline since the utility file doesn't exist
export interface SchemaChanges {
  hasChanges: boolean;
  changedCategories: Set<string>;
  changedItems: Map<string, Set<string>>;
  addedCategories: Set<string>;
  deletedCategories: Set<string>;
  addedItems: Map<string, Set<string>>;
  deletedItems: Map<string, Set<string>>;
}

export interface LocalCommitteesSchemaState {
  // Local state
  localSchema: CommitteesSchema | null;
  originalSchema: CommitteesSchema | null;
  
  // Change detection
  hasUnsavedChanges: boolean;
  changes: SchemaChanges;
  
  // Actions
  updateLocalSchema: (schema: CommitteesSchema) => void;
  resetLocalChanges: () => void;
  syncChangesToServer: () => Promise<void>;
  
  // Committee management
  addCommittee: (committee: CommitteeFormData) => void;
  updateCommittee: (committeeKey: string, updates: Partial<Committee>) => void;
  deleteCommittee: (committeeKey: string) => void;
  
  // Member management
  addMember: (committeeKey: string, memberId: string) => void;
  removeMember: (committeeKey: string, memberId: string) => void;
  
  // State from original hook
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
}

/**
 * Custom hook for managing local committees schema state with change detection
 * Builds upon the existing useCommitteesManagement hook to provide local state management
 */
export function useLocalCommitteesSchema(): LocalCommitteesSchemaState {
  const { currentOrganization } = useOrganization();
  const {
    committeesSchema: serverSchema,
    loading: isLoading,
    operationLoading: isUpdating,
    error,
    updateCommitteesSchema,
  } = useCommitteesManagement(currentOrganization?.id);

  // Local state for the schema
  const [localSchema, setLocalSchema] = useState<CommitteesSchema | null>(null);
  const [originalSchema, setOriginalSchema] = useState<CommitteesSchema | null>(null);

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
  const hasUnsavedChanges = useMemo(() => {
    if (!originalSchema && !localSchema) return false;
    if (!originalSchema || !localSchema) return true;
    return JSON.stringify(originalSchema) !== JSON.stringify(localSchema);
  }, [originalSchema, localSchema]);

  const changes = useMemo(() => {
    // Simple change detection for committees - return empty changes object
    return {
      hasChanges: hasUnsavedChanges,
      changedCategories: new Set<string>(),
      changedItems: new Map<string, Set<string>>(),
      addedCategories: new Set<string>(),
      deletedCategories: new Set<string>(),
      addedItems: new Map<string, Set<string>>(),
      deletedItems: new Map<string, Set<string>>(),
    };
  }, [hasUnsavedChanges]);

  // Update local schema
  const updateLocalSchema = useCallback((schema: CommitteesSchema) => {
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

    try {
      await updateCommitteesSchema(localSchema);
      // The useEffect above will handle resetting the local state after successful update
    } catch (error) {
      // Error is handled by the original hook
      throw error;
    }
  }, [localSchema, hasUnsavedChanges, updateCommitteesSchema]);

  // Committee management functions
  const addCommittee = useCallback((committeeData: CommitteeFormData) => {
    if (!localSchema) {
      // Create initial schema if it doesn't exist
      const committeeKey = committeeData.name.toLowerCase().replace(/\s+/g, '_');
      const newCommittee: Committee = {
        ...committeeData,
        members: [],
        positions: [],
        created_date: new Date().toISOString(),
      };

      const newSchema: CommitteesSchema = {
        committees: {
          [committeeKey]: newCommittee,
        },
      };

      setLocalSchema(newSchema);
      if (!originalSchema) {
        setOriginalSchema({ committees: {} });
      }
      return;
    }

    const committeeKey = committeeData.name.toLowerCase().replace(/\s+/g, '_');
    const newCommittee: Committee = {
      ...committeeData,
      members: [],
      positions: [],
      created_date: new Date().toISOString(),
    };

    const updatedSchema: CommitteesSchema = {
      committees: {
        ...localSchema.committees,
        [committeeKey]: newCommittee,
      },
    };

    setLocalSchema(updatedSchema);
  }, [localSchema, originalSchema]);

  const updateCommittee = useCallback((committeeKey: string, updates: Partial<Committee>) => {
    if (!localSchema || !localSchema.committees[committeeKey]) return;

    const updatedCommittee: Committee = {
      ...localSchema.committees[committeeKey],
      ...updates,
    };

    const updatedSchema: CommitteesSchema = {
      committees: {
        ...localSchema.committees,
        [committeeKey]: updatedCommittee,
      },
    };

    setLocalSchema(updatedSchema);
  }, [localSchema]);

  const deleteCommittee = useCallback((committeeKey: string) => {
    if (!localSchema || !localSchema.committees[committeeKey]) return;

    const { [committeeKey]: deletedCommittee, ...remainingCommittees } = localSchema.committees;

    const updatedSchema: CommitteesSchema = {
      committees: remainingCommittees,
    };

    setLocalSchema(updatedSchema);
  }, [localSchema]);

  // Member management functions
  const addMember = useCallback((committeeKey: string, memberId: string) => {
    if (!localSchema || !localSchema.committees[committeeKey]) return;

    const committee = localSchema.committees[committeeKey];
    if (committee.members.includes(memberId)) return; // Member already exists

    const updatedCommittee: Committee = {
      ...committee,
      members: [...committee.members, memberId],
    };

    const updatedSchema: CommitteesSchema = {
      committees: {
        ...localSchema.committees,
        [committeeKey]: updatedCommittee,
      },
    };

    setLocalSchema(updatedSchema);
  }, [localSchema]);

  const removeMember = useCallback((committeeKey: string, memberId: string) => {
    if (!localSchema || !localSchema.committees[committeeKey]) return;

    const committee = localSchema.committees[committeeKey];
    const updatedMembers = committee.members.filter(id => id !== memberId);

    const updatedCommittee: Committee = {
      ...committee,
      members: updatedMembers,
    };

    const updatedSchema: CommitteesSchema = {
      committees: {
        ...localSchema.committees,
        [committeeKey]: updatedCommittee,
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
    
    // Committee management
    addCommittee,
    updateCommittee,
    deleteCommittee,
    
    // Member management
    addMember,
    removeMember,
    
    // State from original hook
    isLoading,
    error,
    isUpdating,
  };
}