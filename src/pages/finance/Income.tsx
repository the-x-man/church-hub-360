import { TrendingUp } from 'lucide-react';

export function Income() {
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Income Management
      </h2>
      <p className="text-muted-foreground">
        This page will contain income tracking, revenue sources, 
        and financial inflow management. Implementation coming soon.
      </p>
    </div>
  );
}