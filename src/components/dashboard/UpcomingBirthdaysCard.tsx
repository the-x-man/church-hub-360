import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Gift } from 'lucide-react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useBranchScope } from '@/hooks/useBranchScope'

function daysUntilBirthday(dobIso: string) {
  const now = new Date()
  const dob = new Date(dobIso)
  const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate())
  if (next < now) next.setFullYear(now.getFullYear() + 1)
  const diff = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

interface UpcomingBirthdaysCardProps { branchId?: string }
export function UpcomingBirthdaysCard({ branchId }: UpcomingBirthdaysCardProps) {
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const scope = useBranchScope(orgId)
  const { data: members = [] } = useQuery({
    queryKey: ['dashboard-birthdays', orgId, branchId || 'all', scope.isScoped ? scope.branchIds : 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('members_summary')
        .select('id, full_name, date_of_birth, branch_id')
        .eq('organization_id', orgId!)
        .not('date_of_birth', 'is', null)
      if (branchId) {
        query = query.eq('branch_id', branchId)
      } else if (scope.isScoped) {
        if (scope.branchIds.length === 0) return []
        query = query.in('branch_id', scope.branchIds)
      }
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    staleTime: 60 * 1000,
  })

  const upcoming = members
    .filter((m: any) => m.date_of_birth)
    .map((m: any) => ({ ...m, days: daysUntilBirthday(m.date_of_birth as string) }))
    .filter((m: any) => m.days <= 30)
    .sort((a: any, b: any) => a.days - b.days)

  const within3 = upcoming.filter((m: any) => m.days <= 3)

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">Upcoming Birthdays</CardTitle>
        <div className="flex items-center space-x-2">
          {within3.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-2.5 w-2.5 rounded-full bg-red-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{`${within3.length} within 3 days`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/20">
            <Gift className="h-4 w-4 text-pink-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{upcoming.length.toLocaleString()}</div>
        <CardDescription>Next 30 days</CardDescription>
        {upcoming.slice(0, 3).length > 0 && (
          <div className="mt-3 space-y-1">
            {upcoming.slice(0, 3).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{m.full_name}</span>
                <span className="font-medium">{m.days} days</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}