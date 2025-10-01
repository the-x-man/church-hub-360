import { TrendingDown } from 'lucide-react';

export function Expenses() {
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <TrendingDown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Expense Management
      </h2>
      <p className="text-muted-foreground">
        This page will contain expense tracking, bill management, 
        and financial outflow monitoring. Implementation coming soon.
      </p>
    </div>
  );
}