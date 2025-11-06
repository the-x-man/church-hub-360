import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
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
  demographic_groups?: Array<'children' | 'young_adults' | 'adults'>;
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

      if (params.session_ids && params.session_ids.length > 0) {
        sessionQuery = sessionQuery.in('id', params.session_ids);
      } else if (params.occasion_ids && params.occasion_ids.length > 0) {
        sessionQuery = sessionQuery.in('occasion_id', params.occasion_ids);
      }

      if (params.date_from) {
        sessionQuery = sessionQuery.gte('start_time', params.date_from);
      }
      if (params.date_to) {
        sessionQuery = sessionQuery.lte('end_time', params.date_to);
      }

      const { data: sessionsData, error: sessionsErr } = await sessionQuery;
      if (sessionsErr) throw sessionsErr;
      const sessions = (sessionsData || []) as AttendanceSessionWithRelations[];
      const sessionIds = sessions.map((s) => s.id);

      // If no sessions matched, return empty report
      if (sessionIds.length === 0) {
        return {
          summary: {
            total_attendance: 0,
            unique_members: 0,
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
      const memberFilterSet = new Set<string>();
      if (params.member_ids && params.member_ids.length > 0) {
        params.member_ids.forEach((id) => memberFilterSet.add(id));
      }
      if (params.group_ids && params.group_ids.length > 0) {
        const groupMembers = await getMemberIdsForGroups(params.group_ids);
        groupMembers.forEach((id) => memberFilterSet.add(id));
      }
      if (params.tag_item_ids && params.tag_item_ids.length > 0) {
        const tagMembers = await getMemberIdsForTags(params.tag_item_ids, orgId);
        tagMembers.forEach((id) => memberFilterSet.add(id));
      }

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

      // 4b) Apply demographic filters if provided (age-based categories)
      if (params.demographic_groups && params.demographic_groups.length > 0) {
        const inGroups = new Set<string>();
        for (const m of members) {
          const age = m.age ?? null;
          if (age === null) continue;
          if (age <= 12 && params.demographic_groups.includes('children')) inGroups.add(m.id);
          else if (age >= 13 && age <= 24 && params.demographic_groups.includes('young_adults')) inGroups.add(m.id);
          else if (age >= 25 && params.demographic_groups.includes('adults')) inGroups.add(m.id);
        }
        members = members.filter((m) => inGroups.has(m.id));
        records = records.filter((r) => inGroups.has(r.member_id));
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
      const byAgeGroup: Record<string, number> = {
        Children: 0, // 0-12
        Youth: 0,    // 13-25
        Adults: 0,   // 26-59
        Seniors: 0,  // 60+
      };
      const byGender: Record<string, number> = {};
      for (const m of members) {
        const age = m.age ?? null;
        if (age !== null) {
          if (age <= 12) byAgeGroup.Children++;
          else if (age <= 25) byAgeGroup.Youth++;
          else if (age <= 59) byAgeGroup.Adults++;
          else byAgeGroup.Seniors++;
        }
        const g = (m.gender || 'unknown').toString();
        byGender[g] = (byGender[g] || 0) + 1;
      }

      // 8) Summary
      const total_attendance = records.length;
      const unique_members = memberIds.length;
      const sessions_count = sessions.length;
      const days_span = trend.length > 0 ? trend.length : 0;
      const average_per_day = days_span > 0 ? Math.round((total_attendance / days_span) * 100) / 100 : 0;
      const peak_day = trend.length > 0 ? trend.reduce((acc, cur) => (cur.count > acc.count ? cur : acc), trend[0]) : undefined;
      const top_session = sessionBreakdown.length > 0
        ? { session_id: sessionBreakdown[0].session_id, name: sessionBreakdown[0].session_name, count: sessionBreakdown[0].count }
        : undefined;

      return {
        summary: { total_attendance, unique_members, sessions_count, days_span, average_per_day, peak_day, top_session },
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