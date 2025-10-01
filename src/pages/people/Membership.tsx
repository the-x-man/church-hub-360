import { UserCheck } from 'lucide-react';

export function Membership() {
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <UserCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Membership Management
      </h2>
      <p className="text-muted-foreground">
        This page will contain member registration, profiles, family management, 
        and membership status tracking. Implementation coming soon.
      </p>
    </div>
  );
}