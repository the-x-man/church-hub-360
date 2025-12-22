import { OrganizationSelector } from '../shared/OrganizationSelector';
import { UserProfileDropdown } from '../shared/UserProfileDropdown';
import { RestartToUpdateButton } from '../../modules/auto-update/RestartToUpdateButton';
import { NotificationCenter } from '../shared/NotificationCenter';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50">
      <div className="flex items-center justify-between h-full px-6 md:px-6 pl-12 md:pl-6">
        <div className="flex items-center space-x-4">
          <OrganizationSelector />
        </div>

        <div className="flex items-center space-x-4">
          <RestartToUpdateButton />
        </div>

        <div className="flex items-center space-x-4">
          <NotificationCenter />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}
