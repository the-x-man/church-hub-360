import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Boxes } from 'lucide-react'
import { useAssets } from '@/hooks/assets/useAssets'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'
import { useBranchScope } from '@/hooks/useBranchScope'

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { startIso: start.toISOString(), endIso: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString() }
}

interface AssetsCardProps { branchId?: string }
export function AssetsCard({ branchId }: AssetsCardProps) {
  const { data: assetsPage } = useAssets({ page: 1, pageSize: 1, branch_id: branchId })
  const totalAssets = assetsPage?.total || 0
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const { startIso, endIso } = monthBounds(new Date())
  const scope = useBranchScope(orgId)

  const { data: addedThisMonth = 0 } = useQuery({
    queryKey: ['dashboard-assets-added', orgId, branchId || 'all', scope.isScoped ? scope.branchIds : 'all', startIso, endIso],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('assets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId!)
        .eq('is_deleted', false)
        .gte('created_at', startIso)
        .lte('created_at', endIso)
      if (branchId) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
      } else if (scope.isScoped) {
        if (scope.branchIds.length === 0) return 0
        const ids = scope.branchIds.join(',')
        query = query.or(`branch_id.in.(${ids}),branch_id.is.null`)
      }
      const { count, error } = await query
      if (error) throw error
      return count || 0
    },
    staleTime: 60 * 1000,
  })

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">Total Assets</CardTitle>
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
          <Boxes className="h-4 w-4 text-amber-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{totalAssets.toLocaleString()}</div>
        <CardDescription>Total assets</CardDescription>
        <div className="mt-3 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Added this month</span>
            <span className="font-medium">{addedThisMonth}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}