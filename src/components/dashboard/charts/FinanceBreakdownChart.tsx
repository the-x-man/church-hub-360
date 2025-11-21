import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'
import { useBranchScope } from '@/hooks/useBranchScope'

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { startIso: start.toISOString(), endIso: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString() }
}

interface FinanceBreakdownChartProps { branchId?: string }
export function FinanceBreakdownChart({ branchId }: FinanceBreakdownChartProps) {
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const { startIso, endIso } = monthBounds(new Date())
  const scope = useBranchScope(orgId)
  const { data: incomeRows = [] } = useQuery({
    queryKey: ['dashboard-income-month', orgId, branchId || 'all', scope.isScoped ? scope.branchIds : 'all', startIso, endIso],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('income')
        .select('amount,income_type,branch_id')
        .eq('organization_id', orgId!)
        .eq('is_deleted', false)
        .gte('date', startIso)
        .lte('date', endIso)
      if (branchId) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
      } else if (scope.isScoped) {
        if (scope.branchIds.length === 0) return []
        const ids = scope.branchIds.join(',')
        query = query.or(`branch_id.in.(${ids}),branch_id.is.null`)
      }
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    staleTime: 60 * 1000,
  })
  const totals = (incomeRows as any[]).reduce((acc: Record<string, number>, r: any) => {
    acc[r.income_type] = (acc[r.income_type] || 0) + (r.amount || 0)
    return acc
  }, {})
  const data = [
    { name: 'General Income', value: totals['general_income'] || 0 },
    { name: 'Contributions', value: totals['contribution'] || 0 },
    { name: 'Donations', value: totals['donation'] || 0 },
    { name: 'Pledge Payments', value: totals['pledge_payment'] || 0 },
  ]
  const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b']
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Finance Breakdown (This Month)</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {data.map((_, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}