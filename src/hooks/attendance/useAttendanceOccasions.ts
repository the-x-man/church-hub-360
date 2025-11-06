import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  AttendanceOccasion,
  CreateAttendanceOccasionInput,
  UpdateAttendanceOccasionInput,
  AttendanceOccasionWithRelations,
  AttendanceOccasionFilters,
  AttendanceOccasionSort,
} from "@/types/attendance";

// Query keys
export const attendanceOccasionKeys = {
  all: ['attendance-occasions'] as const,
  lists: () => [...attendanceOccasionKeys.all, 'list'] as const,
  list: (organizationId: string, filters?: AttendanceOccasionFilters) => 
    [...attendanceOccasionKeys.lists(), organizationId, filters] as const,
  details: () => [...attendanceOccasionKeys.all, 'detail'] as const,
  detail: (id: string) => [...attendanceOccasionKeys.details(), id] as const,
  stats: () => [...attendanceOccasionKeys.all, 'stats'] as const,
  organizationStats: (organizationId: string) => 
    [...attendanceOccasionKeys.stats(), organizationId] as const,
};

/**
 * Hook to fetch attendance occasions for an organization
 */
export function useAttendanceOccasions(
  filters?: AttendanceOccasionFilters,
  sort?: AttendanceOccasionSort
) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: attendanceOccasionKeys.list(currentOrganization?.id || '', filters),
    queryFn: async (): Promise<AttendanceOccasionWithRelations[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('attendance_occasions')
        .select(`
          *,
          branches(name),
          profiles!attendance_occasions_created_by_fkey2(
            first_name,
            last_name
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false);

      // Apply filters
      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      if (filters?.has_recurrence !== undefined) {
        if (filters.has_recurrence) {
          query = query.not('recurrence_rule', 'is', null);
        } else {
          query = query.is('recurrence_rule', null);
        }
      }
      
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('name');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include related information
      return (data || []).map(occasion => ({
        ...occasion,
        branch_name: occasion.branches?.name || null,
        created_by_name: occasion.profiles?.first_name && occasion.profiles?.last_name 
          ? `${occasion.profiles.first_name} ${occasion.profiles.last_name}`.trim()
          : null,
        // These would be calculated from actual session data in a real implementation
        upcoming_sessions_count: 0,
        total_sessions_count: 0,
        average_attendance: 0,
      }));
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch a single attendance occasion by ID
 */
export function useAttendanceOccasion(id: string) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: attendanceOccasionKeys.detail(id),
    queryFn: async (): Promise<AttendanceOccasionWithRelations> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('attendance_occasions')
        .select(`
          *,
          branches(name),
          profiles!attendance_occasions_created_by_fkey2(
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error) throw error;

      return {
        ...data,
        branch_name: data.branches?.name || null,
        created_by_name: data.profiles?.first_name && data.profiles?.last_name 
          ? `${data.profiles.first_name} ${data.profiles.last_name}`.trim()
          : null,
        upcoming_sessions_count: 0,
        total_sessions_count: 0,
        average_attendance: 0,
      };
    },
    enabled: !!currentOrganization?.id && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to create a new attendance occasion
 */
export function useCreateAttendanceOccasion() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateAttendanceOccasionInput): Promise<AttendanceOccasion> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User authentication required');

      const occasionData = {
        ...input,
        organization_id: currentOrganization.id,
        created_by: user.id,
        is_active: input.is_active ?? true,
      };

      const { data, error } = await supabase
        .from('attendance_occasions')
        .insert(occasionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch occasions list
      queryClient.invalidateQueries({
        queryKey: attendanceOccasionKeys.lists(),
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: attendanceOccasionKeys.stats(),
      });

      toast.success("Attendance occasion status updated successfully");
    },
    onError: (error) => {
      console.error('Error creating attendance occasion:', error);
      toast.error('Failed to create attendance occasion');
    },
  });
}

/**
 * Hook to update an attendance occasion
 */
export function useUpdateAttendanceOccasion() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: UpdateAttendanceOccasionInput 
    }): Promise<AttendanceOccasion> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('attendance_occasions')
        .update({...updates, last_updated_by: user?.id || null })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch occasions list
      queryClient.invalidateQueries({
        queryKey: attendanceOccasionKeys.lists(),
      });
      
      // Invalidate specific occasion detail
      queryClient.invalidateQueries({
        queryKey: attendanceOccasionKeys.detail(data.id),
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: attendanceOccasionKeys.stats(),
      });

      toast.success('Attendance occasion updated successfully');
    },
    onError: (error) => {
      console.error('Error updating attendance occasion:', error);
      toast.error('Failed to update attendance occasion');
    },
  });
}

/**
 * Hook to delete an attendance occasion
 */
export function useDeleteAttendanceOccasion() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { error } = await supabase
        .from('attendance_occasions')
        .update({ 
          is_deleted: true, 
          last_updated_by: user?.id || null  
        })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceOccasionKeys.all });
      toast.success("Attendance occasion deleted successfully");
    },
    onError: (error) => {
      console.error('Error deleting attendance occasion:', error);
      toast.error('Failed to delete attendance occasion');
    },
  });
}

/**
 * Hook to toggle attendance occasion active status
 */
export function useToggleAttendanceOccasionStatus() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      isActive 
    }: { 
      id: string; 
      isActive: boolean 
    }): Promise<AttendanceOccasion> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('attendance_occasions')
        .update({ is_active: isActive, last_updated_by: user?.id || null })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch occasions list
      queryClient.invalidateQueries({
        queryKey: attendanceOccasionKeys.lists(),
      });
      
      // Invalidate specific occasion detail
      queryClient.invalidateQueries({
        queryKey: attendanceOccasionKeys.detail(data.id),
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: attendanceOccasionKeys.stats(),
      });

      toast.success(`Attendance occasion ${data.is_active ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error) => {
      console.error('Error toggling attendance occasion status:', error);
      toast.error('Failed to update attendance occasion status');
    },
  });
}