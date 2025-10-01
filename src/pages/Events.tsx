import { CalendarDays } from 'lucide-react';

export function Events() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Events and Activities</h1>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Events and Activities
        </h2>
        <p className="text-muted-foreground">
          This page will contain event planning, scheduling, activity management, 
          and calendar features for church events. Implementation coming soon.
        </p>
      </div>
    </div>
  );
}