import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { Input } from '../components/ui/input';

export function Users() {
  const users = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin',
      status: 'Active',
      lastLogin: '2 hours ago',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'User',
      status: 'Active',
      lastLogin: '1 day ago',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'User',
      status: 'Inactive',
      lastLogin: '1 week ago',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-2">
            Manage user accounts and permissions
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all user accounts in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>

            <div className="border rounded-lg">
              <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-600">
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Status</div>
                <div>Last Login</div>
                <div>Actions</div>
              </div>
              
              {users.map((user) => (
                <div key={user.id} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-gray-600">{user.email}</div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'Admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                  <div className="text-gray-600">{user.lastLogin}</div>
                  <div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}