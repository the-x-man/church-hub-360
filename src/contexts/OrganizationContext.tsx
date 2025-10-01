import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  useCreateOrganization,
  useInviteUser,
  useRemoveUser,
  useUpdateOrganization,
  useUpdateUserRole,
  useUserOrganizations,
} from '../hooks/useOrganizationQueries';
import { seedOrganizationIfNeeded } from '../utils/seedingUtils';
import type {
  CreateOrganizationData,
  Organization,
  OrganizationContextType,
  OrganizationRole,
  OrganizationWithRole,
  UpdateOrganizationData,
} from '../types/organizations';
import { useAuth } from './AuthContext';

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

const STORAGE_KEY = 'fmt-selected-organization';

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { user } = useAuth();
  const [
    currentOrganization,
    setCurrentOrganization,
  ] = useState<OrganizationWithRole | null>(null);
  const [
    selectedOrgId,
    setSelectedOrgId,
    removeSelectedOrgId,
  ] = useLocalStorage<string | null>(STORAGE_KEY, null);

  // Use React Query hooks
  const {
    data: userOrganizations = [],
    isLoading,
    error: queryError,
    refetch: refreshOrganizations,
  } = useUserOrganizations(user?.id);

  const createOrganizationMutation = useCreateOrganization();
  const updateOrganizationMutation = useUpdateOrganization();
  const inviteUserMutation = useInviteUser();
  const updateUserRoleMutation = useUpdateUserRole();
  const removeUserMutation = useRemoveUser();

  // Convert query error to string for compatibility
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'An error occurred'
    : null;

  // Handle organization selection logic in useEffect to avoid state updates during render
  useEffect(() => {
    if (userOrganizations.length === 1) {
      selectOrganization(userOrganizations[0].id);
    } else if (userOrganizations.length > 1 && selectedOrgId) {
      selectOrganization(selectedOrgId);
    }
  }, [userOrganizations, selectedOrgId]);

  const selectOrganization = async (organizationId: string) => {
    const organization = userOrganizations.find(
      (org) => org.id === organizationId
    );
    if (organization) {
      setSelectedOrgId(organizationId);
      setCurrentOrganization(organization);
    }
  };

  const createOrganization = async (
    data: CreateOrganizationData
  ): Promise<Organization> => {
    if (!user) throw new Error('User not authenticated');
    const newOrganization = await createOrganizationMutation.mutateAsync({
      data,
      userId: user.id,
    });

    // Seed the new organization with default people configuration
    try {
      await seedOrganizationIfNeeded(newOrganization.id, {
        useMinimalSchema: false, // Use full schema for new organizations
        userId: user.id,
      });
    } catch (seedError) {
      console.error(
        'Failed to seed organization with default configuration:',
        seedError
      );
      // Don't fail the organization creation if seeding fails
      // The organization can still be used and seeded later
    }

    // Create the organization with role for immediate selection
    const newOrganizationWithRole: OrganizationWithRole = {
      ...newOrganization,
      user_role: 'owner' as OrganizationRole,
    };

    setSelectedOrgId(newOrganization.id);
    setCurrentOrganization(newOrganizationWithRole);

    return newOrganization;
  };

  const updateOrganization = async (
    data: UpdateOrganizationData
  ): Promise<Organization> => {
    return updateOrganizationMutation.mutateAsync(data);
  };

  const inviteUser = async (
    organizationId: string,
    email: string,
    role: OrganizationRole
  ): Promise<void> => {
    await inviteUserMutation.mutateAsync({ organizationId, email, role });
  };

  const updateUserRole = async (
    userOrganizationId: string,
    role: OrganizationRole
  ): Promise<void> => {
    await updateUserRoleMutation.mutateAsync({ userOrganizationId, role });
  };

  const removeUser = async (userOrganizationId: string): Promise<void> => {
    await removeUserMutation.mutateAsync(userOrganizationId);
  };

  const refreshOrganizationsWrapper = async (): Promise<void> => {
    await refreshOrganizations();
  };

  const clearOrganizationData = () => {
    setCurrentOrganization(null);
    removeSelectedOrgId();
  };

  const value: OrganizationContextType = {
    currentOrganization,
    userOrganizations,
    selectedOrgId,
    isLoading,
    error,
    selectOrganization,
    createOrganization,
    updateOrganization,
    refreshOrganizations: refreshOrganizationsWrapper,
    inviteUser,
    updateUserRole,
    removeUser,
    clearOrganizationData,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    );
  }
  return context;
}
