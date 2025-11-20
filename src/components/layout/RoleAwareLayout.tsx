import { MainLayout } from './MainLayout';
import { AttendanceManagerLayout } from './role-layouts/AttendanceManagerLayout';
import { AttendanceRepLayout } from './role-layouts/AttendanceRepLayout';
import { FinanceAdminLayout } from './role-layouts/FinanceAdminLayout';
// Access policy is centralized via registry
import { chooseRestrictedLayout } from '@/registry/access/policy';
import { useOrganization } from '@/contexts/OrganizationContext';

export function RoleAwareLayout() {
  // Access state is derived via registry policy now
  const { currentOrganization } = useOrganization();
  const role = currentOrganization?.user_role as any;
  const overrides = currentOrganization?.user_permissions?.visibility_overrides;

  const kind = chooseRestrictedLayout(role, overrides);
  if (kind === 'attendance_manager') return <AttendanceManagerLayout />;
  if (kind === 'attendance_rep') return <AttendanceRepLayout />;
  if (kind === 'finance') return <FinanceAdminLayout />;

  return <MainLayout />;
}
