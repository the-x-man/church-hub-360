import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AuthRouteProps {
  children: React.ReactNode;
}

export function AuthRoute({ children }: AuthRouteProps) {
  const { user, session } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const isAuthenticated = !!(user && session);

  // Handle /new-password - requires session for password reset flow
  if (currentPath === '/new-password') {
    console.log(session);
    if (!session) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  }

  // Handle public auth routes (/login, /password-reset)
  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname;
    if (
      from &&
      !['/login', '/password-reset', '/new-password'].includes(from)
    ) {
      return <Navigate to={from} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Allow unauthenticated users to access auth pages
  return <>{children}</>;
}
