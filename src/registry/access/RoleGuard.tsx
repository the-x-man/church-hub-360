import { useOrganization } from '@/contexts/OrganizationContext';
import type { OrganizationRole } from '@/types/organizations';
import type { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: OrganizationRole[];
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: RoleGuardProps) {
  const { currentOrganization } = useOrganization();
  if (!currentOrganization) return <>{fallback}</>;
  const hasPermission = allowedRoles.includes(currentOrganization.user_role);
  if (!hasPermission) return <>{fallback}</>;
  return <>{children}</>;
}

export function useRoleCheck() {
  const { currentOrganization } = useOrganization();
  const hasRole = (roles: OrganizationRole[]) => {
    if (!currentOrganization) return false;
    return roles.includes(currentOrganization.user_role);
  };
  const canManageAllData = () => hasRole(['owner', 'admin']);
  const canViewAllData = () =>
    hasRole(['owner', 'admin', 'branch_admin', 'finance_admin', 'write']);
  const canManageBranchData = () =>
    hasRole(['owner', 'admin', 'branch_admin', 'finance_admin', 'write']);
  const canManageUserData = () => hasRole(['owner', 'admin', 'branch_admin']);
  const canWrite = () => hasRole(['owner', 'admin', 'branch_admin', 'write']);
  const canRead = () =>
    hasRole(['owner', 'admin', 'branch_admin', 'write', 'read']);
  const isOwner = () => hasRole(['owner']);
  const isAdmin = () => hasRole(['admin']);
  const isBranchAdmin = () => hasRole(['branch_admin']);
  const isFinanceAdmin = () => hasRole(['finance_admin']);
  const isAttendanceManager = () => hasRole(['attendance_manager']);
  const isAttendanceRep = () => hasRole(['attendance_rep']);
  return {
    hasRole,
    canManageAllData,
    canViewAllData,
    canManageBranchData,
    canManageUserData,
    canWrite,
    canRead,
    isOwner,
    isAdmin,
    isBranchAdmin,
    isFinanceAdmin,
    isAttendanceManager,
    isAttendanceRep,
    currentRole: currentOrganization?.user_role,
  };
}
