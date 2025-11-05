import { useOrganization } from '@/contexts/OrganizationContext';
import {
  useMarkAttendance,
  useSessionAllowedMembers,
  useSessionAttendanceRecords,
  useUnmarkAttendance,
} from '@/hooks/attendance/useAttendanceMarking';
import { useMembersSummaryPaginated } from '@/hooks/useMemberQueries';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import type { AttendanceSessionWithRelations } from '@/types/attendance';
import type { MemberSummary } from '@/types/members';
import { useMemo, useState } from 'react';
import {
  LinksQrCard,
  ManualMarkingCard,
  SessionDetailsHeader,
  SessionInfoCard,
} from './session-details';

interface SessionDetailsViewProps {
  session: AttendanceSessionWithRelations;
  onBack: () => void;
}

export function SessionDetailsView({
  session,
  onBack,
}: SessionDetailsViewProps) {
  const { currentOrganization } = useOrganization();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFields, setSearchFields] = useState<
    ('name' | 'email' | 'phone' | 'membershipId')[]
  >(() => {
    const fields: ('name' | 'email' | 'phone' | 'membershipId')[] = ['name'];
    const modes = session.marking_modes || {};
    if (modes.email) fields.push('email');
    if (modes.phone) fields.push('phone');
    if (modes.membership_id) fields.push('membershipId');
    return fields;
  });

  // Fetch allowed members (union of allowed criteria) if any are specified
  const {
    data: allowedMembers = [],
    isLoading: loadingAllowed,
  } = useSessionAllowedMembers(session);

  // Fallback to all members when no allowed list
  const { data: paginated, isLoading: loadingAll } = useMembersSummaryPaginated(
    currentOrganization?.id,
    { search },
    page,
    pageSize,
    null
  );

  // Attendance records for present state
  const { data: records = [] } = useSessionAttendanceRecords(session.id);
  const markAttendance = useMarkAttendance();
  const unmarkAttendance = useUnmarkAttendance();

  // Tag names for displaying allowed tags
  const { data: orgTags = [] } = useTagsQuery(currentOrganization?.id);
  const allowedTagLabels = useMemo(() => {
    const byId = new Map<string, string>();
    orgTags.forEach((tag) =>
      tag.tag_items.forEach((item) => byId.set(item.id, item.name))
    );
    return (session.allowed_tags || []).map((id) => byId.get(id) || id);
  }, [orgTags, session.allowed_tags]);

  // Resolve the list to display
  const baseMembers: MemberSummary[] = useMemo(() => {
    if (allowedMembers.length > 0) return allowedMembers;
    return paginated?.members || [];
  }, [allowedMembers, paginated]);

  // Client-side filtering by search term and fields
  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return baseMembers;
    return baseMembers.filter((member) => {
      const pool: string[] = [];
      if (searchFields.includes('name')) {
        pool.push(
          (
            member.full_name ||
            `${member.first_name} ${member.last_name}` ||
            ''
          ).toLowerCase()
        );
      }
      if (searchFields.includes('email'))
        pool.push((member.email || '').toLowerCase());
      if (searchFields.includes('phone'))
        pool.push((member.phone || '').toLowerCase());
      if (searchFields.includes('membershipId'))
        pool.push((member.membership_id || '').toLowerCase());
      return pool.some((val) => val.includes(term));
    });
  }, [baseMembers, search, searchFields]);

  const presentMap = useMemo(() => {
    const map = new Map<string, boolean>();
    records.forEach((r) => {
      map.set(r.member_id, true);
    });
    return map;
  }, [records]);

  const handlePresent = async (memberId: string) => {
    if (!session.marking_modes?.manual) return;
    await markAttendance.mutateAsync({ sessionId: session.id, memberId });
  };

  const handleAbsent = async (memberId: string) => {
    if (!session.marking_modes?.manual) return;
    await unmarkAttendance.mutateAsync({ sessionId: session.id, memberId });
  };

  return (
    <div className="space-y-6">
      {/* Header / Back */}
      <SessionDetailsHeader session={session} onBack={onBack} />

      {/* Details + Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details and manual marking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session info */}
          <SessionInfoCard
            session={session}
            allowedTagLabels={allowedTagLabels}
          />

          {/* Manual marking table */}
          <ManualMarkingCard
            session={session}
            search={search}
            setSearch={setSearch}
            searchFields={searchFields}
            setSearchFields={setSearchFields}
            filteredMembers={filteredMembers}
            presentMap={presentMap}
            onPresent={handlePresent}
            onAbsent={handleAbsent}
            markPending={markAttendance.isPending}
            unmarkPending={unmarkAttendance.isPending}
            hasAllowedList={allowedMembers.length > 0}
            loadingAllowed={loadingAllowed}
            loadingAll={loadingAll}
            page={page}
            pageSize={pageSize}
            paginatedTotal={(paginated?.total || 0) as number}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            markingModes={session.marking_modes}
          />
        </div>

        {/* Right: Link/QR placeholders */}
        <div className="space-y-6">
          <LinksQrCard />
        </div>
      </div>
    </div>
  );
}
