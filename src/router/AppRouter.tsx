import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthRoute } from '../components/auth/AuthRoute';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { MainLayout } from '../components/layout/MainLayout';
import { AuthProvider } from '../contexts/AuthContext';
import { OrganizationProvider } from '../contexts/OrganizationContext';
import { PaletteProvider } from '../contexts/PaletteContext';

// Auth pages
import { Login } from '../pages/auth/Login';
import { NewPassword } from '../pages/auth/NewPassword';
import { PasswordReset } from '../pages/auth/PasswordReset';

// Organization pages
import { OrganizationSelection } from '../pages/OrganizationSelection';

// Protected pages
import { Branches } from '../pages/Branches';
import { Dashboard } from '../pages/Dashboard';
import { Profile } from '../pages/Profile';
import { Settings } from '../pages/Settings';
import { OrganizationSelectionProtectedRoute } from '@/components/auth/OrganizationSelectionProtectedRoute';
import UserManagement from '@/pages/UserManagement';

// Main section pages
import { Communication } from '../pages/Communication';
import { Events } from '../pages/Events';
import { Reports } from '../pages/Reports';
import { ActivityLogs } from '../pages/ActivityLogs';

// People section pages
import { People } from '../pages/people';
import { Committees } from '../pages/people/Committees';
import { Tags } from '../pages/people/Tags';
import { AddMember } from '../pages/people/AddMember';
import { MemberDetail } from '../pages/people/MemberDetail';
import Membership from '../pages/people/Membership';
import MembershipList from '../pages/people/MembershipList';
import { Attendance } from '../pages/people/Attendance';

// Finance section pages
import { Finance } from '../pages/finance';
import { Income } from '../pages/finance/Income';
import Expenses from '../pages/finance/Expenses';
import Contributions from '../pages/finance/Contributions';
import { Pledges } from '../pages/finance/Pledges';
import BudgetPlanning from '../pages/finance/BudgetPlanning';
import { MembershipFormBuilder } from '@/pages/people/MembershipFormBuilder';

function AppRoutes() {
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

      {/* Organization selection route */}
      <Route
        path="/select-organization"
        element={
          <ProtectedRoute>
            <OrganizationSelection />
          </ProtectedRoute>
        }
      />

      {/* Protected routes with layout - requires organization */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <OrganizationSelectionProtectedRoute>
              <MainLayout />
            </OrganizationSelectionProtectedRoute>
          </ProtectedRoute>
        }
      >
        {/* Dashboard - default route */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Main application routes */}
        <Route path="branches" element={<Branches />} />
        <Route path="profile" element={<Profile />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="settings" element={<Settings />} />

        {/* People section with nested routes */}
        <Route path="people" element={<People />}>
          <Route path="tags" element={<Tags />} />
          <Route path="committee" element={<Committees />} />
          <Route path="form-builder" element={<MembershipFormBuilder />} />
          <Route path="membership" element={<Membership />}>
            <Route index element={<MembershipList />} />
            <Route path="add" element={<AddMember />} />
            <Route path=":memberId" element={<MemberDetail />} />
          </Route>
          <Route path="attendance" element={<Attendance />} />
        </Route>

        {/* Finance section with nested routes */}
        <Route path="finance" element={<Finance />}>
          <Route path="income" element={<Income />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="contributions" element={<Contributions />} />
          <Route path="pledges" element={<Pledges />} />
          <Route path="budget-planning" element={<BudgetPlanning />} />
        </Route>

        {/* Other main pages */}
        <Route path="communication" element={<Communication />} />
        <Route path="events" element={<Events />} />
        <Route path="reports" element={<Reports />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
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
        <OrganizationProvider>
          <PaletteProvider>
            <AppRoutes />
          </PaletteProvider>
        </OrganizationProvider>
      </AuthProvider>
    </HashRouter>
  );
}
