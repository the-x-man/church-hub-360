import type { UserWithRelations } from '@/types/user-management';
import type { UserRole } from '@/lib/auth';

interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  branchIds?: string[];
  assignAllBranches?: boolean;
  selectedBranchIds?: string[];
}

interface UserChanges {
  profileChanges: {
    first_name?: string;
    last_name?: string;
  };
  roleChanged: boolean;
  newRole?: UserRole;
  branchChanges: {
    added: string[];
    removed: string[];
    hasChanges: boolean;
  };
  hasAnyChanges: boolean;
}

/**
 * Detects changes between current user data and update data
 * @param currentUser - The current user object from the database
 * @param updateData - The new data from the form
 * @param activeBranches - List of active branch IDs
 * @returns Object containing detected changes
 */
export function detectUserChanges(
  currentUser: UserWithRelations,
  updateData: UserUpdateData,
  activeBranches: string[] = []
): UserChanges {
  const changes: UserChanges = {
    profileChanges: {},
    roleChanged: false,
    branchChanges: {
      added: [],
      removed: [],
      hasChanges: false
    },
    hasAnyChanges: false
  };

  // Check profile changes
  if (updateData.firstName !== undefined && updateData.firstName !== currentUser.profile.first_name) {
    changes.profileChanges.first_name = updateData.firstName;
  }
  
  if (updateData.lastName !== undefined && updateData.lastName !== currentUser.profile.last_name) {
    changes.profileChanges.last_name = updateData.lastName;
  }

  // Check role changes
  const currentRole = currentUser.user_organizations?.[0]?.role;
  if (updateData.role && updateData.role !== currentRole) {
    changes.roleChanged = true;
    changes.newRole = updateData.role;
  }

  // Check branch changes
  const currentBranchIds = currentUser.user_branches?.map(ub => ub.branch_id).filter((id): id is string => id !== null) || [];
  
  let newBranchIds: string[] = [];
  if (updateData.assignAllBranches) {
    newBranchIds = activeBranches;
  } else if (updateData.selectedBranchIds) {
    newBranchIds = updateData.selectedBranchIds;
  } else if (updateData.branchIds) {
    newBranchIds = updateData.branchIds;
  }

  // Find added and removed branches
  changes.branchChanges.added = newBranchIds.filter(id => !currentBranchIds.includes(id));
  changes.branchChanges.removed = currentBranchIds.filter(id => !newBranchIds.includes(id));
  changes.branchChanges.hasChanges = changes.branchChanges.added.length > 0 || changes.branchChanges.removed.length > 0;

  // Determine if there are any changes
  changes.hasAnyChanges = 
    Object.keys(changes.profileChanges).length > 0 ||
    changes.roleChanged ||
    changes.branchChanges.hasChanges;

  return changes;
}

/**
 * Transforms form data to the format expected by the update API
 * @param updateData - The form data
 * @param activeBranches - List of active branch IDs
 * @returns Transformed data for the API
 */
export function transformUserUpdateData(
  updateData: UserUpdateData,
  activeBranches: string[] = []
) {
  const transformedData = {
    firstName: updateData.firstName,
    lastName: updateData.lastName,
    role: updateData.role,
    branchIds: updateData.assignAllBranches
      ? activeBranches
      : updateData.selectedBranchIds || updateData.branchIds || [],
  };

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(transformedData).filter(([_, value]) => value !== undefined)
  );
}