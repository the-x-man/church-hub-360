import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useMemberStatistics } from '@/hooks/useMemberQueries'

interface MembersGenderChartProps { branchId?: string }
export function MembersGenderChart({ branchId }: MembersGenderChartProps) {
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const { data: stats } = useMemberStatistics(orgId, branchId)
  const data = stats
    ? Object.entries(stats.members_by_gender).map(([gender, count]) => ({ gender, count }))
    : []
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Members by Gender</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="gender" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}