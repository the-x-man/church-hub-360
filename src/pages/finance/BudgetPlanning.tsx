import { Calculator } from 'lucide-react';

export function BudgetPlanning() {
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Budget Planning
      </h2>
      <p className="text-muted-foreground">
        This page will contain budget creation, financial planning, 
        and budget monitoring tools. Implementation coming soon.
      </p>
    </div>
  );
}