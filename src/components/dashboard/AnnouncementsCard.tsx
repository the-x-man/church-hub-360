import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAnnouncements } from '@/hooks/announcements/useAnnouncements'

interface AnnouncementsCardProps { branchId?: string }
export function AnnouncementsCard({ branchId }: AnnouncementsCardProps) {
  const { data: announcements = [] } = useAnnouncements(branchId)
  const recent = announcements.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recent.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <div className="truncate">
                <span className="font-medium text-foreground truncate">{a.title}</span>
                <span className="ml-2 text-muted-foreground">{a.created_by_name || '—'}</span>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="text-sm text-muted-foreground">No announcements yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}