import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import supabase from '../../utils/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, session, setSession, initializeUser } = useAuth();
  const location = useLocation();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      // Initialize session first
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      
      // Then initialize user if session exists
      if (data.session) {
        await initializeUser();
      }
      
      setInitializing(false);
    }

    init();
  }, [setSession, initializeUser]);

  // Show loading while initializing
  if (initializing) {
    return <LoadingSpinner />;
  }

  // If no session, redirect to login
  if (!session) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // If no user data but session exists, redirect to login
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Check if user account is active
  if (!user.is_active) {
    return (
      <Navigate
        to="/login"
        state={{ from: location, message: 'Your account has been deactivated. Please contact support.' }}
        replace
      />
    );
  }

  // If user is first-time login, redirect to new-password
  if (user.is_first_login) {
    return (
      <Navigate
        to="/new-password"
        state={{ email: user.profile.email, isFirstLogin: true }}
        replace
      />
    );
  }

  // User is authenticated and active, allow access
  return <>{children}</>;
}
