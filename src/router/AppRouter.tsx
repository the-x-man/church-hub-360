import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AuthRoute } from '../components/auth/AuthRoute';
import { MainLayout } from '../components/layout/MainLayout';

// Auth pages
import { Login } from '../pages/auth/Login';
import { PasswordReset } from '../pages/auth/PasswordReset';
import { NewPassword } from '../pages/auth/NewPassword';

// Protected pages
import { Dashboard } from '../pages/Dashboard';
import { Users } from '../pages/Users';
import { AppVersions } from '../pages/AppVersions';
import { Settings } from '../pages/Settings';
import { TestRoutes } from '../pages/TestRoutes';

function AppRoutes() {
  const isDev = import.meta.env.DEV;

  return (
    <Routes>
      {/* Public/Auth routes */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />
      <Route
        path="/password-reset"
        element={
          <AuthRoute>
            <PasswordReset />
          </AuthRoute>
        }
      />
      <Route
        path="/new-password"
        element={
          <AuthRoute>
            <NewPassword />
          </AuthRoute>
        }
      />

      {/* Protected routes with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard - default route */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Main application routes */}
        <Route path="users" element={<Users />} />
        <Route path="app-versions" element={<AppVersions />} />
        <Route path="settings" element={<Settings />} />

        {/* Development-only test routes */}
        {isDev && <Route path="test" element={<TestRoutes />} />}
      </Route>

      {/* Catch-all route - redirect to dashboard if authenticated, login if not */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function AppRouter() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
