import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccess } from '@/registry/access/engine';
import { useOrganization } from '@/contexts/OrganizationContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface AccessGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AccessGuard({ children, fallback = null }: AccessGuardProps) {
  const { canAccessPath, role } = useAccess();
  const { currentOrganization, isLoading } = useOrganization();
  const location = useLocation();
  if (isLoading || !currentOrganization || !role) return <LoadingSpinner />;
  const allow = canAccessPath(location.pathname);
  if (!allow) return <>{fallback}</>;
  return <>{children}</>;
}