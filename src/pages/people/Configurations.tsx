import { Settings } from 'lucide-react';

export function PeopleConfigurations() {
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        People Configurations
      </h2>
      <p className="text-muted-foreground">
        This page will contain settings for member categories, roles, permissions, 
        and people management configurations. Implementation coming soon.
      </p>
    </div>
  );
}