import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { useEvents } from '@/hooks/events/useEvents'
import { useMemo } from 'react'

interface UpcomingEventsCardProps { branchId?: string }
export function UpcomingEventsCard({ branchId }: UpcomingEventsCardProps) {
  const filters = useMemo(() => ({ date_from: new Date().toISOString(), status: 'upcoming' as const, branch_id: branchId }), [branchId])
  const { data: events = [] } = useEvents(filters)
  const total = events.length
  const top = events.slice(0, 3)

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">Upcoming Events</CardTitle>
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
          <Calendar className="h-4 w-4 text-green-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{total.toLocaleString()}</div>
        <CardDescription>Scheduled</CardDescription>
        {top.length > 0 && (
          <div className="mt-3 space-y-1">
            {top.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{e.title}</span>
                <span className="font-medium">{new Date(e.start_time).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}