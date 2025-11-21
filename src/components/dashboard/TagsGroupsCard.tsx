import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Tags } from 'lucide-react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useTagsQuery } from '@/hooks/useRelationalTags'
import { useGroups } from '@/hooks/useGroups'

interface TagsGroupsCardProps { branchId?: string }
export function TagsGroupsCard({ branchId }: TagsGroupsCardProps) {
  const { currentOrganization } = useOrganization()
  const orgId = currentOrganization?.id
  const { data: tags = [] } = useTagsQuery(orgId)
  const { data: groupsPage } = useGroups({ page: 1, pageSize: 1, branchId })
  const groupsTotal = groupsPage?.totalCount || 0
  const tagsTotal = tags.length

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">Tags & Groups</CardTitle>
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/20">
          <Tags className="h-4 w-4 text-slate-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{(tagsTotal + groupsTotal).toLocaleString()}</div>
        <CardDescription>Total tags and groups</CardDescription>
        <div className="mt-3 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tags</span>
            <span className="font-medium">{tagsTotal}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Groups</span>
            <span className="font-medium">{groupsTotal}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}