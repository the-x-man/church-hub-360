import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
// import { useAccess } from '@/registry/access/engine';

export function AttendanceRepLayout() {
  const location = useLocation();
  
  const allowedPrefixes = ['/people/attendance/marking', '/profile'];
  const isAllowed = allowedPrefixes.some((p) =>
    location.pathname.startsWith(p)
  );

  

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 min-h-screen">
        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-3">
            <Link to="/people/attendance/marking">
              <Button>Mark Attendance</Button>
            </Link>
          </div>

          {!isAllowed ? (
            <Navigate to="/people/attendance/marking" replace />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}
