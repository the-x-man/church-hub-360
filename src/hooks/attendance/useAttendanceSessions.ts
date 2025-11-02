import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  AttendanceSession,
  CreateAttendanceSessionInput,
  UpdateAttendanceSessionInput,
  AttendanceSessionWithRelations,
  AttendanceSessionFilters,
  AttendanceSessionSort,
  AttendanceSessionStats,
  AttendanceSessionStatus,
} from "@/types/attendance";

// Query keys
export const attendanceSessionKeys = {
  all: ['attendance-sessions'] as const,
  lists: () => [...attendanceSessionKeys.all, 'list'] as const,
  list: (organizationId: string, filters?: AttendanceSessionFilters) => 
    [...attendanceSessionKeys.lists(), organizationId, filters] as const,
  details: () => [...attendanceSessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...attendanceSessionKeys.details(), id] as const,
  stats: () => [...attendanceSessionKeys.all, 'stats'] as const,
  organizationStats: (organizationId: string) => 
    [...attendanceSessionKeys.stats(), organizationId] as const,
};

/**
 * Helper function to determine session status
 */
function getSessionStatus(session: Pick<AttendanceSession, 'start_time' | 'end_time' | 'is_open'>): AttendanceSessionStatus {
  const now = new Date();
  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);

  if (now < startTime) return 'upcoming';
  if (now >= startTime && now <= endTime && session.is_open) return 'active';
  if (now >= startTime && now <= endTime && !session.is_open) return 'closed';
  return 'past';
}

/**
 * Hook to fetch attendance sessions for an organization
 */
export function useAttendanceSessions(
  filters?: AttendanceSessionFilters,
  sort?: AttendanceSessionSort
) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: attendanceSessionKeys.list(currentOrganization?.id || '', filters),
    queryFn: async (): Promise<AttendanceSessionWithRelations[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('attendance_sessions')
        .select(`
          *,
          attendance_occasions(name, description),
          profiles!attendance_sessions_created_by_fkey(
            first_name,
            last_name
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false);

      // Apply filters
      if (filters?.occasion_id) {
        query = query.eq('occasion_id', filters.occasion_id);
      }
      
      if (filters?.is_open !== undefined) {
        query = query.eq('is_open', filters.is_open);
      }
      
      if (filters?.allow_public_marking !== undefined) {
        query = query.eq('allow_public_marking', filters.allow_public_marking);
      }
      
      if (filters?.proximity_required !== undefined) {
        query = query.eq('proximity_required', filters.proximity_required);
      }
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%`);
      }
      
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      if (filters?.date_from) {
        query = query.gte('start_time', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('end_time', filters.date_to);
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('start_time', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include related information and computed fields
      return (data || []).map(session => {
        const status = getSessionStatus(session);

        return {
          ...session,
          occasion_name: session.attendance_occasions?.name || null,
          occasion_description: session.attendance_occasions?.description || null,
          created_by_name: session.profiles?.first_name && session.profiles?.last_name 
            ? `${session.profiles.first_name} ${session.profiles.last_name}`.trim()
            : null,
          // These would be calculated from actual attendance records in a real implementation
          attendance_count: 0,
          total_expected: 0,
          attendance_rate: 0,
          is_past: status === 'past',
          is_current: status === 'active',
          is_future: status === 'upcoming',
        };
      }).filter(session => {
        // Apply status filter if provided
        if (filters?.status) {
          const sessionStatus = getSessionStatus(session);
          return sessionStatus === filters.status;
        }
        return true;
      });
    },
    enabled: !!currentOrganization?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter than occasions since sessions are more time-sensitive)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single attendance session by ID
 */
export function useAttendanceSession(id: string) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: attendanceSessionKeys.detail(id),
    queryFn: async (): Promise<AttendanceSessionWithRelations> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          attendance_occasions(name, description),
          profiles!attendance_sessions_created_by_fkey(
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Session not found');

      const status = getSessionStatus(data);

      return {
        ...data,
        occasion_name: data.attendance_occasions?.name || null,
        occasion_description: data.attendance_occasions?.description || null,
        created_by_name: data.profiles?.first_name && data.profiles?.last_name 
          ? `${data.profiles.first_name} ${data.profiles.last_name}`.trim()
          : null,
        attendance_count: 0,
        total_expected: 0,
        attendance_rate: 0,
        is_past: status === 'past',
        is_current: status === 'active',
        is_future: status === 'upcoming',
      };
    },
    enabled: !!currentOrganization?.id && !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch attendance session statistics
 */
export function useAttendanceSessionStats() {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: attendanceSessionKeys.organizationStats(currentOrganization?.id || ''),
    queryFn: async (): Promise<AttendanceSessionStats> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('id, start_time, end_time, is_open')
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false);

      if (error) throw error;

      const sessions = data || [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      let activeSessions = 0;
      let upcomingSessions = 0;
      let pastSessions = 0;
      let todaySessions = 0;
      let thisWeekSessions = 0;

      sessions.forEach(session => {
        const startTime = new Date(session.start_time);
        const status = getSessionStatus(session);

        switch (status) {
          case 'active':
            activeSessions++;
            break;
          case 'upcoming':
            upcomingSessions++;
            break;
          case 'past':
          case 'closed':
            pastSessions++;
            break;
        }

        // Check if session is today
        if (startTime >= today && startTime < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
          todaySessions++;
        }

        // Check if session is this week
        if (startTime >= weekStart && startTime < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          thisWeekSessions++;
        }
      });

      return {
        total_sessions: sessions.length,
        active_sessions: activeSessions,
        upcoming_sessions: upcomingSessions,
        past_sessions: pastSessions,
        today_sessions: todaySessions,
        this_week_sessions: thisWeekSessions,
        average_attendance_rate: 0, // Would be calculated from actual attendance records
        total_attendance_records: 0, // Would be calculated from actual attendance records
      };
    },
    enabled: !!currentOrganization?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new attendance session
 */
export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateAttendanceSessionInput): Promise<AttendanceSession> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User authentication required');

      // Ensure organization_id matches current organization
      const sessionData = {
        ...input,
        organization_id: currentOrganization.id,
        created_by: user.id,
        marking_modes: {
          email: true,
          phone: true,
          membership_id: true,
          manual: true,
          public_link: false,
          ...input.marking_modes,
        },
      };

      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch sessions list
      queryClient.invalidateQueries({
        queryKey: attendanceSessionKeys.lists(),
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: attendanceSessionKeys.stats(),
      });

      toast.success('Attendance session created successfully');
    },
    onError: (error) => {
      console.error('Error creating attendance session:', error);
      toast.error('Failed to create attendance session');
    },
  });
}

/**
 * Hook to update an attendance session
 */
export function useUpdateAttendanceSession() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: UpdateAttendanceSessionInput 
    }): Promise<AttendanceSession> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('attendance_sessions')
        .update({...updates, last_updated_by: user?.id || null })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch sessions list
      queryClient.invalidateQueries({
        queryKey: attendanceSessionKeys.lists(),
      });
      
      // Invalidate specific session detail
      queryClient.invalidateQueries({
        queryKey: attendanceSessionKeys.detail(data.id),
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: attendanceSessionKeys.stats(),
      });

      toast.success('Attendance session updated successfully');
    },
    onError: (error) => {
      console.error('Error updating attendance session:', error);
      toast.error('Failed to update attendance session');
    },
  });
}

/**
 * Hook to delete an attendance session (soft delete)
 */
export function useDeleteAttendanceSession() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { error } = await supabase
        .from('attendance_sessions')
        .update({ 
          is_deleted: true, 
          last_updated_by: user?.id || null 
        })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate and refetch sessions list
      queryClient.invalidateQueries({
        queryKey: attendanceSessionKeys.lists(),
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: attendanceSessionKeys.stats(),
      });

      toast.success('Attendance session deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting attendance session:', error);
      toast.error('Failed to delete attendance session');
    },
  });
}

/**
 * Hook to toggle session open/closed status
 */
export function useToggleSessionStatus() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      isOpen 
    }: { 
      id: string; 
      isOpen: boolean 
    }): Promise<AttendanceSession> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('attendance_sessions')
        .update({ 
          is_open: isOpen, 
          last_updated_by: user?.id || null 
        })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch sessions list
      queryClient.invalidateQueries({
        queryKey: attendanceSessionKeys.lists(),
      });
      
      // Invalidate specific session detail
      queryClient.invalidateQueries({
        queryKey: attendanceSessionKeys.detail(data.id),
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: attendanceSessionKeys.stats(),
      });

      toast.success(`Session ${data.is_open ? 'opened' : 'closed'} successfully`);
    },
    onError: (error) => {
      console.error('Error toggling session status:', error);
      toast.error('Failed to update session status');
    },
  });
}