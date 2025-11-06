import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { DEFAULT_AGE_GROUPS, formatAgeGroupLabel } from '@/constants/defaultAgeGroups';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { AttendanceSessionWithRelations } from '@/types/attendance';
import type { MemberSummary } from '@/types/members';

export interface ReportQueryParams {
  date_from: string;
  date_to: string;
  occasion_ids?: string[];
  session_ids?: string[];
  member_ids?: string[];
  tag_item_ids?: string[];
  group_ids?: string[];
}

export interface ReportTrendPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface SessionParticipation {
  session_id: string;
  session_name: string | null;
  start_time: string;
  end_time: string;
  count: number;
}

export interface DemographicBreakdown {
  byAgeGroup: Record<string, number>;
  byGender: Record<string, number>;
}

export interface AttendanceReportData {
  summary: {
    total_attendance: number;
    unique_members: number;
    /**
     * Expected total attendance.
     * - Default: based solely on session restrictions (unrestricted uses active membership).
     * - Tags/Groups mode: based on the selected cohort (tags/groups) across all sessions.
     */
    expected_total_members: number;
    /** Number of unique occasions represented by the sessions set */
    occasions_count: number;
    /** Attendance rate as a fraction of expected_total_members (0–1) */
    attendance_rate: number;
    sessions_count: number;
    days_span: number;
    average_per_day: number;
    peak_day?: { date: string; count: number };
    top_session?: { session_id: string; name: string | null; count: number };
  };
  trend: ReportTrendPoint[];
  sessionBreakdown: SessionParticipation[];
  demographic: DemographicBreakdown;
  records: Array<{ id: string; session_id: string; member_id: string; marked_at: string }>;
  members: MemberSummary[];
  sessions: AttendanceSessionWithRelations[];
}

function ymd(dateIso: string) {
  return dateIso.split('T')[0];
}

async function getMemberIdsForGroups(group_ids: string[]): Promise<string[]> {
  if (group_ids.length === 0) return [];
  const { data, error } = await supabase
    .from('group_members_view')
    .select('member_id')
    .in('group_id', group_ids);
  if (error) throw error;
  const ids = (data || []).map((r: any) => r.member_id).filter(Boolean);
  return Array.from(new Set(ids));
}

async function getMemberIdsForTags(tag_item_ids: string[], organizationId: string): Promise<string[]> {
  if (tag_item_ids.length === 0) return [];
  const { data, error } = await supabase
    .from('members')
    .select('id, member_tag_items!inner(tag_item_id)')
    .eq('organization_id', organizationId)
    .in('member_tag_items.tag_item_id', tag_item_ids);
  if (error) throw error;
  const ids = (data || []).map((m: any) => m.id).filter(Boolean);
  return Array.from(new Set(ids));
}

/** Count active members in the organization (active church membership) */
async function getActiveMemberCount(organizationId: string): Promise<number> {
  const { count, error } = await supabase
    .from('members_summary')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);
  if (error) throw error;
  return count || 0;
}

/**
 * Compute eligible expected members for a single session based solely on its restrictions.
 * - If session has allowed_members/groups/tags: union IDs across these restrictions and return unique count.
 * - If no restrictions present: expected = active membership count for the organization.
 */
async function getEligibleMemberCountForSession(
  session: AttendanceSessionWithRelations,
  organizationId: string,
): Promise<number> {
  const hasAllowedMembers = Array.isArray((session as any).allowed_members) && (session as any).allowed_members.length > 0;
  const hasAllowedGroups = Array.isArray((session as any).allowed_groups) && (session as any).allowed_groups.length > 0;
  const hasAllowedTags = Array.isArray((session as any).allowed_tags) && (session as any).allowed_tags.length > 0;

  const hasRestrictions = hasAllowedMembers || hasAllowedGroups || hasAllowedTags;
  if (!hasRestrictions) {
    return getActiveMemberCount(organizationId);
  }

  const eligibleIds = new Set<string>();

  if (hasAllowedMembers) {
    ((session as any).allowed_members as string[]).forEach((id) => {
      if (id) eligibleIds.add(id);
    });
  }
  if (hasAllowedGroups) {
    const { data: groupAssignments, error: groupErr } = await supabase
      .from('group_members_view')
      .select('member_id')
      .in('group_id', (session as any).allowed_groups as string[]);
    if (groupErr) throw groupErr;
    (groupAssignments || []).forEach((gm: any) => {
      if (gm?.member_id) eligibleIds.add(gm.member_id);
    });
  }
  if (hasAllowedTags) {
    const tagMembers = await getMemberIdsForTags((session as any).allowed_tags as string[], organizationId);
    tagMembers.forEach((id) => eligibleIds.add(id));
  }

  return eligibleIds.size;
}

/**
 * Compute expected eligible count for a session within a selected cohort (tags/groups).
 * - If session has restrictions: return intersection size of cohort with allowed sets.
 * - If no restrictions: expected = cohort size.
 */
async function getEligibleCohortCountForSession(
  session: AttendanceSessionWithRelations,
  organizationId: string,
  cohortSet: Set<string>,
): Promise<number> {
  const hasAllowedMembers = Array.isArray((session as any).allowed_members) && (session as any).allowed_members.length > 0;
  const hasAllowedGroups = Array.isArray((session as any).allowed_groups) && (session as any).allowed_groups.length > 0;
  const hasAllowedTags = Array.isArray((session as any).allowed_tags) && (session as any).allowed_tags.length > 0;

  const hasRestrictions = hasAllowedMembers || hasAllowedGroups || hasAllowedTags;
  if (!hasRestrictions) {
    return cohortSet.size;
  }

  const eligibleIds = new Set<string>();

  if (hasAllowedMembers) {
    ((session as any).allowed_members as string[]).forEach((id) => {
      if (id && cohortSet.has(id)) eligibleIds.add(id);
    });
  }
  if (hasAllowedGroups) {
    const { data: groupAssignments, error: groupErr } = await supabase
      .from('group_members_view')
      .select('member_id')
      .in('group_id', (session as any).allowed_groups as string[]);
    if (groupErr) throw groupErr;
    (groupAssignments || []).forEach((gm: any) => {
      const id = gm?.member_id;
      if (id && cohortSet.has(id)) eligibleIds.add(id);
    });
  }
  if (hasAllowedTags) {
    const tagMembers = await getMemberIdsForTags((session as any).allowed_tags as string[], organizationId);
    tagMembers.forEach((id) => {
      if (cohortSet.has(id)) eligibleIds.add(id);
    });
  }

  return eligibleIds.size;
}

export function useAttendanceReport(params: ReportQueryParams | null) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['attendance-report', currentOrganization?.id, params],
    enabled: !!currentOrganization?.id && !!params,
    queryFn: async (): Promise<AttendanceReportData> => {
      if (!currentOrganization?.id || !params) throw new Error('Organization ID and params required');

      const orgId = currentOrganization.id;

      // 1) Resolve sessions by filters
      let sessionQuery = supabase
        .from('attendance_sessions')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_deleted', false);

      // Always exclude future/upcoming sessions. Include past or closed sessions.
      const nowIso = new Date().toISOString();
      sessionQuery = sessionQuery.or(`end_time.lte.${nowIso},and(is_open.eq.false,start_time.lte.${nowIso})`);

      if (params.session_ids && params.session_ids.length > 0) {
        sessionQuery = sessionQuery.in('id', params.session_ids);
      } else if (params.occasion_ids && params.occasion_ids.length > 0) {
        sessionQuery = sessionQuery.in('occasion_id', params.occasion_ids);
      }
      // Restrict sessions by date when:
      // - Specific sessions are selected, OR
      // - A cohort filter is applied (members/tags/groups modes) where the date range should bound expectation
      // In pure occasions_sessions mode with only occasion selected and sessions set to "All",
      // we continue to rely on records date filtering to avoid hiding closed sessions outside the date window.
      const hasCohortFilters = !!(
        (params.member_ids && params.member_ids.length > 0) ||
        (params.tag_item_ids && params.tag_item_ids.length > 0) ||
        (params.group_ids && params.group_ids.length > 0)
      );
      const restrictSessionsByDate = !!(params.session_ids && params.session_ids.length > 0) || hasCohortFilters;
      if (restrictSessionsByDate) {
        if (params.date_from) {
          sessionQuery = sessionQuery.gte('start_time', params.date_from);
        }
        if (params.date_to) {
          sessionQuery = sessionQuery.lte('end_time', params.date_to);
        }
      }

      const { data: sessionsData, error: sessionsErr } = await sessionQuery;
      if (sessionsErr) throw sessionsErr;
      const sessions = (sessionsData || []) as AttendanceSessionWithRelations[];
      const sessionIds = sessions.map((s) => s.id);
      const occasionIdsSet = new Set<string>(sessions.map((s: any) => s.occasion_id));

      // If no sessions matched, return empty report
      if (sessionIds.length === 0) {
        return {
          summary: {
            total_attendance: 0,
            unique_members: 0,
            expected_total_members: 0,
            occasions_count: 0,
            attendance_rate: 0,
            sessions_count: 0,
            days_span: 0,
            average_per_day: 0,
          },
          trend: [],
          sessionBreakdown: [],
          demographic: { byAgeGroup: {}, byGender: {} },
          records: [],
          members: [],
          sessions,
        };
      }

      // 2) Resolve member filter set (union of explicit members, tags, groups)
      // Build member filter set and retain cohort arrays for tags/groups
      const memberFilterSet = new Set<string>();
      const cohortGroupMembers: string[] = (params.group_ids && params.group_ids.length > 0)
        ? await getMemberIdsForGroups(params.group_ids)
        : [];
      const cohortTagMembers: string[] = (params.tag_item_ids && params.tag_item_ids.length > 0)
        ? await getMemberIdsForTags(params.tag_item_ids, orgId)
        : [];
      if (params.member_ids && params.member_ids.length > 0) {
        params.member_ids.forEach((id) => memberFilterSet.add(id));
      }
      cohortGroupMembers.forEach((id) => memberFilterSet.add(id));
      cohortTagMembers.forEach((id) => memberFilterSet.add(id));

      // 3) Fetch attendance records for selected sessions and date range
      let recordsQuery = supabase
        .from('attendance_records')
        .select('id, session_id, member_id, marked_at')
        .in('session_id', sessionIds);

      if (params.date_from) {
        recordsQuery = recordsQuery.gte('marked_at', params.date_from);
      }
      if (params.date_to) {
        recordsQuery = recordsQuery.lte('marked_at', params.date_to);
      }

      const { data: recordsData, error: recordsErr } = await recordsQuery;
      if (recordsErr) throw recordsErr;
      let records = (recordsData || []) as Array<{ id: string; session_id: string; member_id: string; marked_at: string }>;

      // Apply member filtering if any filter set exists
      if (memberFilterSet.size > 0) {
        const allowedIds = memberFilterSet;
        records = records.filter((r) => allowedIds.has(r.member_id));
      }

      // 4) Fetch members for demographic breakdown
      const memberIds = Array.from(new Set(records.map((r) => r.member_id)));
      let members: MemberSummary[] = [];
      if (memberIds.length > 0) {
        const { data: membersData, error: membersErr } = await supabase
          .from('members_summary')
          .select('*')
          .eq('organization_id', orgId)
          .in('id', memberIds);
        if (membersErr) throw membersErr;
        members = (membersData || []) as MemberSummary[];
      }

      // 5) Compute trend by day
      const trendMap = new Map<string, number>();
      for (const r of records) {
        const day = ymd(r.marked_at);
        trendMap.set(day, (trendMap.get(day) || 0) + 1);
      }
      const trend: ReportTrendPoint[] = Array.from(trendMap.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, count]) => ({ date, count }));

      // 6) Session breakdown counts
      const countBySession = new Map<string, number>();
      for (const r of records) {
        countBySession.set(r.session_id, (countBySession.get(r.session_id) || 0) + 1);
      }
      const sessionBreakdown: SessionParticipation[] = sessions.map((s) => ({
        session_id: s.id,
        session_name: (s as any).name || null,
        start_time: s.start_time,
        end_time: s.end_time,
        count: countBySession.get(s.id) || 0,
      })).sort((a, b) => b.count - a.count);

      // 7) Demographic breakdown by age groups and gender
      // Resolve age groups from people_configurations, fallback to DEFAULT_AGE_GROUPS
      let configuredAgeGroups: Array<{ name: string; min_age: number; max_age: number }> = DEFAULT_AGE_GROUPS;
      try {
        const { data: configRow } = await supabase
          .from('people_configurations')
          .select('age_group')
          .eq('organization_id', orgId)
          .single();
        if (configRow && Array.isArray((configRow as any).age_group) && (configRow as any).age_group.length > 0) {
          configuredAgeGroups = (configRow as any).age_group as Array<{ name: string; min_age: number; max_age: number }>;
        }
      } catch (_) {
        // Ignore and use defaults
      }

      const byAgeGroup: Record<string, number> = {};
      for (const g of configuredAgeGroups) {
        const label = formatAgeGroupLabel(g);
        byAgeGroup[label] = 0;
      }
      const byGender: Record<string, number> = {};
      for (const m of members) {
        const age = m.age ?? null;
        if (age !== null) {
          // Increment first matching configured age group bucket
          for (const g of configuredAgeGroups) {
            if (age >= g.min_age && age <= g.max_age) {
              const label = formatAgeGroupLabel(g);
              byAgeGroup[label] = (byAgeGroup[label] || 0) + 1;
              break;
            }
          }
        }
        const genderKey = (m.gender || 'unknown').toString();
        byGender[genderKey] = (byGender[genderKey] || 0) + 1;
      }

      // 8) Summary
      const total_attendance = records.length;
      const unique_members = memberIds.length;
      const sessions_count = sessions.length;
      // Compute expected totals
      const isTagsGroupsMode = (params.group_ids && params.group_ids.length > 0) || (params.tag_item_ids && params.tag_item_ids.length > 0);
      const isMembersMode = (params.member_ids && params.member_ids.length > 0);
      let expected_total_members = 0;
      if (isTagsGroupsMode || isMembersMode) {
        // Cohort-based expectation across all sessions
        const cohortSet = new Set<string>([
          ...cohortGroupMembers,
          ...cohortTagMembers,
          ...(isMembersMode ? (params.member_ids as string[]) : []),
        ]);
        const perSessionCounts = await Promise.all(
          sessions.map((s) => getEligibleCohortCountForSession(s, orgId, cohortSet)),
        );
        expected_total_members = perSessionCounts.reduce((sum, c) => sum + c, 0);
      } else {
        // Default behavior: based solely on session restrictions
        const restrictedSessions = sessions.filter((s: any) => (
          (Array.isArray(s.allowed_members) && s.allowed_members.length > 0) ||
          (Array.isArray(s.allowed_groups) && s.allowed_groups.length > 0) ||
          (Array.isArray(s.allowed_tags) && s.allowed_tags.length > 0)
        ));
        const unrestrictedSessionsCount = sessions.length - restrictedSessions.length;

        if (unrestrictedSessionsCount > 0) {
          const activeCount = await getActiveMemberCount(orgId);
          expected_total_members += activeCount * unrestrictedSessionsCount;
        }
        if (restrictedSessions.length > 0) {
          const perSessionCounts = await Promise.all(
            restrictedSessions.map((s) => getEligibleMemberCountForSession(s, orgId)),
          );
          expected_total_members += perSessionCounts.reduce((sum, c) => sum + c, 0);
        }
      }
      const occasions_count = occasionIdsSet.size;
      const days_span = trend.length > 0 ? trend.length : 0;
      const average_per_day = days_span > 0 ? Math.round((total_attendance / days_span) * 100) / 100 : 0;
      const attendance_rate = expected_total_members > 0
        ? Math.round(((total_attendance / expected_total_members) * 10000)) / 10000
        : 0;
      const peak_day = trend.length > 0 ? trend.reduce((acc, cur) => (cur.count > acc.count ? cur : acc), trend[0]) : undefined;
      const top_session = sessionBreakdown.length > 0
        ? { session_id: sessionBreakdown[0].session_id, name: sessionBreakdown[0].session_name, count: sessionBreakdown[0].count }
        : undefined;

      return {
        summary: { total_attendance, unique_members, expected_total_members, occasions_count, attendance_rate, sessions_count, days_span, average_per_day, peak_day, top_session },
        trend,
        sessionBreakdown,
        demographic: { byAgeGroup, byGender },
        records,
        members,
        sessions,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}