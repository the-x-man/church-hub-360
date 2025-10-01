import { Calendar } from 'lucide-react';

export function Attendance() {
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Attendance Tracking
      </h2>
      <p className="text-muted-foreground">
        This page will contain attendance recording, tracking, reports, 
        and member participation analytics. Implementation coming soon.
      </p>
    </div>
  );
}