import { useOrganization } from '@/contexts/OrganizationContext';
import React from 'react';
import { Navigate } from 'react-router-dom';

export const OrganizationSelectionProtectedRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userOrganizations, selectedOrgId } = useOrganization();

  if (userOrganizations.length === 0) {
    return <Navigate to="/select-organization" replace />;
  }

  if (userOrganizations.length > 1 && !selectedOrgId) {
    return <Navigate to="/select-organization" replace />;
  }

  return <>{children}</>;
};
