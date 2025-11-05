import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import type { AttendanceSession } from '@/types/attendance';
import type { MemberSummary } from '@/types/members';

// Query keys for attendance marking
export const attendanceMarkingKeys = {
  all: ['attendance-marking'] as const,
  records: (sessionId: string) => [...attendanceMarkingKeys.all, 'records', sessionId] as const,
  allowedMembers: (sessionId: string) => [...attendanceMarkingKeys.all, 'allowed-members', sessionId] as const,
};

export interface AttendanceRecordSummary {
  id: string;
  session_id: string;
  member_id: string;
  marked_by?: string | null;
  marked_by_mode?: string | null;
  marked_at?: string | null;
  is_valid?: boolean | null;
}

/**
 * Fetch existing attendance records for a session (used to show Present/Absent state)
 */
export function useSessionAttendanceRecords(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? attendanceMarkingKeys.records(sessionId) : attendanceMarkingKeys.all,
    queryFn: async (): Promise<AttendanceRecordSummary[]> => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('attendance_records')
        .select('id, session_id, member_id, marked_by, marked_by_mode, marked_at, is_valid')
        .eq('session_id', sessionId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Mark a member as present for a session (upsert attendance_records)
 */
export function useMarkAttendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId, memberId }: { sessionId: string; memberId: string }) => {
      if (!user?.id) throw new Error('User authentication required');
      const payload = {
        session_id: sessionId,
        member_id: memberId,
        marked_by: user.id,
        marked_by_mode: 'manual',
        marked_at: new Date().toISOString(),
        is_valid: true,
      };
      const { error } = await supabase
        .from('attendance_records')
        .upsert(payload, { onConflict: 'session_id,member_id' });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      // Invalidate records for this session
      queryClient.invalidateQueries({ queryKey: attendanceMarkingKeys.records(variables.sessionId) });
    },
  });
}

/**
 * Unmark (set absent) by deleting the record for member + session
 */
export function useUnmarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, memberId }: { sessionId: string; memberId: string }) => {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('session_id', sessionId)
        .eq('member_id', memberId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceMarkingKeys.records(variables.sessionId) });
    },
  });
}

/**
 * Resolve allowed members for a session by unioning allowed_members, allowed_groups, and allowed_tags
 * Returns MemberSummary[] for display. If no allowed criteria present, returns empty array; caller can fallback.
 */
export function useSessionAllowedMembers(session: AttendanceSession | null | undefined) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: session?.id ? attendanceMarkingKeys.allowedMembers(session.id) : attendanceMarkingKeys.all,
    queryFn: async (): Promise<MemberSummary[]> => {
      if (!currentOrganization?.id || !session?.id) return [];

      const orgId = currentOrganization.id;
      const allowedMemberIds = new Set<string>();

      // Allowed members by explicit IDs
      if (session.allowed_members && session.allowed_members.length > 0) {
        session.allowed_members.forEach((id) => allowedMemberIds.add(id));
      }

      // Allowed members via groups
      if (session.allowed_groups && session.allowed_groups.length > 0) {
        const { data: groupAssignments, error: groupErr } = await supabase
          .from('group_members_view')
          .select('member_id, group_id')
          .in('group_id', session.allowed_groups);
        if (groupErr) throw groupErr;
        (groupAssignments || []).forEach((gm: any) => {
          if (gm.member_id) allowedMemberIds.add(gm.member_id);
        });
      }

      // Allowed members via tag items (any match)
      if (session.allowed_tags && session.allowed_tags.length > 0) {
        const { data: tagMembers, error: tagErr } = await supabase
          .from('members')
          .select('id, member_tag_items!inner(tag_item_id)')
          .eq('organization_id', orgId)
          .in('member_tag_items.tag_item_id', session.allowed_tags);
        if (tagErr) throw tagErr;
        (tagMembers || []).forEach((m: any) => {
          if (m.id) allowedMemberIds.add(m.id);
        });
      }

      // If we collected any IDs, fetch MemberSummary from members_summary
      if (allowedMemberIds.size > 0) {
        const ids = Array.from(allowedMemberIds);
        const { data, error } = await supabase
          .from('members_summary')
          .select('*')
          .in('id', ids)
          .eq('organization_id', orgId);
        if (error) throw error;
        return data || [];
      }

      // No allowed criteria present
      return [];
    },
    enabled: !!currentOrganization?.id && !!session?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}