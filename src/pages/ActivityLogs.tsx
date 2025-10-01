import { Activity } from 'lucide-react';

export function ActivityLogs() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Activity Logs
        </h2>
        <p className="text-muted-foreground">
          This page will contain system activity logs, user actions, audit trails, 
          and security monitoring features. Implementation coming soon.
        </p>
      </div>
    </div>
  );
}