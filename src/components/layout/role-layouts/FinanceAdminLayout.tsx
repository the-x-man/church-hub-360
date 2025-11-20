import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useAccess } from '@/registry/access/engine';
import { useOrganization } from '@/contexts/OrganizationContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export function FinanceAdminLayout() {
  const location = useLocation();
  const { canAccess, role } = useAccess();
  const { currentOrganization, isLoading } = useOrganization();
  const allowedPrefixes = ['/finance', '/profile'];
  const isAllowed = allowedPrefixes.some((p) =>
    location.pathname.startsWith(p)
  );

  if (isLoading || !currentOrganization || !role) {
    return <LoadingSpinner />;
  }
  if (!canAccess('finance')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 min-h-screen">
        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-3">
            <Link to="/finance/insights">
              <Button
                variant={
                  location.pathname === '/finance/insights'
                    ? 'default'
                    : 'outline'
                }
              >
                Insights
              </Button>
            </Link>
            <Link to="/finance/income">
              <Button
                variant={
                  location.pathname === '/finance/income'
                    ? 'default'
                    : 'outline'
                }
              >
                Income
              </Button>
            </Link>
            <Link to="/finance/expenses">
              <Button
                variant={
                  location.pathname === '/finance/expenses'
                    ? 'default'
                    : 'outline'
                }
              >
                Expenses
              </Button>
            </Link>
            <Link to="/finance/contributions">
              <Button
                variant={
                  location.pathname === '/finance/contributions'
                    ? 'default'
                    : 'outline'
                }
              >
                Contributions
              </Button>
            </Link>
            <Link to="/finance/pledges">
              <Button
                variant={
                  location.pathname === '/finance/pledges'
                    ? 'default'
                    : 'outline'
                }
              >
                Pledges
              </Button>
            </Link>
          </div>

          {!isAllowed ? (
            <Navigate to="/finance/insights" replace />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}
