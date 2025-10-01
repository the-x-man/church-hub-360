import { Outlet } from 'react-router-dom';
import { Users } from 'lucide-react';

export function People() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">People Management</h1>
      </div>
      
      <Outlet />
    </div>
  );
}