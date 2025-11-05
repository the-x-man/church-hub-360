import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AttendanceSessionWithRelations } from '@/types/attendance';

interface SessionDetailsHeaderProps {
  session: AttendanceSessionWithRelations;
  onBack: () => void;
}

function StatusBadge({ session }: { session: AttendanceSessionWithRelations }) {
  if (session.is_current && session.is_open) {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Active
      </Badge>
    );
  }
  if (session.is_current && !session.is_open) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        Closed
      </Badge>
    );
  }
  if (session.is_future) {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        Upcoming
      </Badge>
    );
  }
  return <Badge variant="secondary">Past</Badge>;
}

export function SessionDetailsHeader({ session, onBack }: SessionDetailsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Session Details</h2>
        <p className="text-muted-foreground">View details and mark attendance</p>
      </div>
      <div className="flex gap-2">
        <StatusBadge session={session} />
        <Button variant="outline" onClick={onBack}>Back to Sessions</Button>
      </div>
    </div>
  );
}