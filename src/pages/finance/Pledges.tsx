import { Target } from 'lucide-react';

export function Pledges() {
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Pledges Management
      </h2>
      <p className="text-muted-foreground">
        This page will contain pledge tracking, commitment management, 
        and pledge fulfillment monitoring. Implementation coming soon.
      </p>
    </div>
  );
}