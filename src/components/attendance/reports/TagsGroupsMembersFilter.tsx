import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import MultipleSelector, { type Option } from '@/components/ui/multiselect';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import { useGroups } from '@/hooks/useGroups';
import { useOrganization } from '@/contexts/OrganizationContext';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { useMemberDetails, type MemberSearchResult } from '@/hooks/useMemberSearch';

interface TagsGroupsMembersFilterProps {
  tagItemIds: string[];
  onTagItemIdsChange: (ids: string[]) => void;
  groupIds: string[];
  onGroupIdsChange: (ids: string[]) => void;
  memberIds: string[];
  onMemberIdsChange: (ids: string[]) => void;
  className?: string;
}

export function TagsGroupsMembersFilter({
  tagItemIds,
  onTagItemIdsChange,
  groupIds,
  onGroupIdsChange,
  memberIds,
  onMemberIdsChange,
  className,
}: TagsGroupsMembersFilterProps) {
  const { currentOrganization } = useOrganization();
  const { data: tags = [], isLoading: tagsLoading } = useTagsQuery(currentOrganization?.id);
  const { data: groupsResp, isLoading: groupsLoading } = useGroups();
  const groups = groupsResp?.data || [];

  // Resolve current memberIds to full objects for controlled value
  const { data: selectedMemberDetails = [] } = useMemberDetails(memberIds);
  const selectedMembers: MemberSearchResult[] = useMemo(() => {
    return selectedMemberDetails.map((m) => ({
      ...m,
      display_name: m.full_name || `${m.first_name} ${m.last_name}`.trim(),
      display_subtitle: [m.membership_id, m.email, m.phone].filter(Boolean).join(' • '),
    }));
  }, [selectedMemberDetails]);

  const tagOptions: Option[] = useMemo(() => {
    return tags.flatMap((tag) =>
      (tag.tag_items || [])
        .filter((ti) => ti.is_active)
        .map((ti) => ({ value: ti.id, label: `${tag.name}: ${ti.name}` }))
    );
  }, [tags]);

  const groupOptions: Option[] = useMemo(() => {
    return groups.map((g) => ({ value: g.id, label: g.name }));
  }, [groups]);

  const selectedTagOptions = useMemo(() => tagOptions.filter((o) => tagItemIds.includes(o.value)), [tagOptions, tagItemIds]);
  const selectedGroupOptions = useMemo(() => groupOptions.filter((o) => groupIds.includes(o.value)), [groupOptions, groupIds]);

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tags</Label>
          <MultipleSelector
            value={selectedTagOptions}
            options={tagOptions}
            placeholder={tagsLoading ? 'Loading tags...' : 'Select tags'}
            onChange={(opts) => onTagItemIdsChange(opts.map((o) => o.value))}
          />
          <div className="text-xs text-muted-foreground">Matches members with any selected tag.</div>
        </div>

        <div className="space-y-2">
          <Label>Groups</Label>
          <MultipleSelector
            value={selectedGroupOptions}
            options={groupOptions}
            placeholder={groupsLoading ? 'Loading groups...' : 'Select groups'}
            onChange={(opts) => onGroupIdsChange(opts.map((o) => o.value))}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label>Members</Label>
        <MemberSearchTypeahead
          organizationId={currentOrganization?.id || ''}
          value={selectedMembers}
          onChange={(members) => onMemberIdsChange(members.map((m) => m.id))}
          placeholder="Search and select members"
          multiSelect={true}
        />
      </div>
    </div>
  );
}