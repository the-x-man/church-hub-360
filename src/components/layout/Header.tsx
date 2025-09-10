import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">FMT Template</h1>
        </div>

        <div className="flex items-center space-x-4">
          {user?.profile && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>
                {user.profile.first_name} {user.profile.last_name}
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
