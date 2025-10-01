import { Outlet } from 'react-router-dom';
import { DollarSign } from 'lucide-react';

export function Finance() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Finance Management</h1>
      </div>
      
      <Outlet />
    </div>
  );
}