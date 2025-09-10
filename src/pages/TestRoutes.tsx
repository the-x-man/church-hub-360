import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { TestTube, Code, Database, Zap } from 'lucide-react';

export function TestRoutes() {
  const { user } = useAuth();

  const testSections = [
    {
      title: 'Authentication Tests',
      description: 'Test authentication-related functionality',
      icon: Zap,
      tests: [
        {
          name: 'Current User Info',
          description: 'Display current user authentication state',
          action: () => {
            console.log('User:', user);
            alert(`User ID: ${user?.id}\nEmail: ${user?.profile?.email}\nProfile: ${user?.profile?.first_name} ${user?.profile?.last_name}`);
          },
        },
        {
          name: 'Test Sign Out',
          description: 'Test the sign out functionality',
          action: () => {
            if (confirm('Are you sure you want to sign out?')) {
              // This would trigger sign out
              console.log('Sign out test triggered');
            }
          },
        },
      ],
    },
    {
      title: 'Database Tests',
      description: 'Test database connectivity and operations',
      icon: Database,
      tests: [
        {
          name: 'Test Supabase Connection',
          description: 'Verify connection to Supabase database',
          action: () => {
            console.log('Testing Supabase connection...');
            alert('Check console for Supabase connection test results');
          },
        },
        {
          name: 'Test User Profile Query',
          description: 'Test querying user profile data',
          action: () => {
            console.log('Testing user profile query...');
            console.log('Current user profile:', user);
            alert('Check console for user profile query results');
          },
        },
      ],
    },
    {
      title: 'UI Component Tests',
      description: 'Test various UI components and interactions',
      icon: Code,
      tests: [
        {
          name: 'Test Notifications',
          description: 'Test notification system',
          action: () => {
            alert('This is a test notification!');
          },
        },
        {
          name: 'Test Modal',
          description: 'Test modal dialog functionality',
          action: () => {
            const result = confirm('This is a test modal. Do you want to continue?');
            console.log('Modal result:', result);
          },
        },
        {
          name: 'Test Form Validation',
          description: 'Test form validation logic',
          action: () => {
            const email = prompt('Enter an email to validate:');
            const isValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            alert(`Email "${email}" is ${isValid ? 'valid' : 'invalid'}`);
          },
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <TestTube className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Routes</h1>
          <p className="text-gray-600 mt-2">
            Development-only testing utilities and debugging tools
          </p>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <TestTube className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-orange-800">Development Mode Only</span>
        </div>
        <p className="text-sm text-orange-700 mt-1">
          This page is only available in development mode and will not be accessible in production builds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {testSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <span>{section.title}</span>
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.tests.map((test) => (
                    <div key={test.name} className="space-y-2">
                      <div>
                        <h4 className="font-medium text-sm">{test.name}</h4>
                        <p className="text-xs text-gray-500">{test.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={test.action}
                        className="w-full"
                      >
                        Run Test
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment Information</CardTitle>
          <CardDescription>
            Current development environment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700">Environment</h4>
              <p className="text-sm text-gray-600">{import.meta.env.MODE}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700">Development Mode</h4>
              <p className="text-sm text-gray-600">{import.meta.env.DEV ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700">Base URL</h4>
              <p className="text-sm text-gray-600">{import.meta.env.BASE_URL}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700">User ID</h4>
              <p className="text-sm text-gray-600">{user?.id || 'Not authenticated'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}