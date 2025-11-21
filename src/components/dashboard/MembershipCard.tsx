import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Users, UserPlus } from 'lucide-react'
import { useMemberStatistics } from '@/hooks/useMemberQueries'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'
import { useBranchScope } from '@/hooks/useBranchScope'

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

interface MembershipCardProps { branchId?: string }
export function MembershipCard({ branchId }: MembershipCardProps) {
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const { data: stats } = useMemberStatistics(orgId, branchId)
  const { start, end } = monthBounds(new Date())
  const scope = useBranchScope(orgId)
  const { data: newConvertsCount } = useQuery({
    queryKey: ['dashboard-new-converts', orgId, branchId || 'all', scope.isScoped ? scope.branchIds : 'all', start, end],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId!)
        .eq('membership_type', 'New Convert')
        .gte('date_joined', start)
        .lte('date_joined', end)
      if (branchId) {
        query = query.eq('branch_id', branchId)
      } else if (scope.isScoped) {
        if (scope.branchIds.length === 0) return 0
        query = query.in('branch_id', scope.branchIds)
      }
      const { count, error } = await query
      if (error) throw error
      return count || 0
    },
    staleTime: 60 * 1000,
  })

  const total = stats?.total_members || 0
  const newThisMonth = stats?.new_members_this_month || 0
  const convertsThisMonth = newConvertsCount || 0

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">Membership</CardTitle>
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{total.toLocaleString()}</div>
        <CardDescription>Total members</CardDescription>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <UserPlus className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">New this month</span>
            </div>
            <span className="font-medium text-green-600">{newThisMonth}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <UserPlus className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">New converts</span>
            </div>
            <span className="font-medium text-green-600">{convertsThisMonth}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}