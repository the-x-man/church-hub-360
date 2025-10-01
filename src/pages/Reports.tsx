import { BarChart3 } from 'lucide-react';

export function Reports() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Reports & Insights</h1>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Reports & Insights
        </h2>
        <p className="text-muted-foreground">
          This page will contain analytics, reports, charts, and insights about 
          church activities, finances, and member engagement. Implementation coming soon.
        </p>
      </div>
    </div>
  );
}