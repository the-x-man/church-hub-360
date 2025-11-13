import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  Announcement,
  AnnouncementWithMeta,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '@/types/announcements';

export const announcementKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementKeys.all, 'list'] as const,
  list: (organizationId: string) => [...announcementKeys.lists(), organizationId] as const,
  details: () => [...announcementKeys.all, 'detail'] as const,
  detail: (id: string) => [...announcementKeys.details(), id] as const,
};

export function useAnnouncements() {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: announcementKeys.list(currentOrganization?.id || ''),
    queryFn: async (): Promise<AnnouncementWithMeta[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('announcements')
        .select(`*, profiles!announcements_created_by_fkey2(first_name,last_name)`) 
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => {
        let slides_count: number | undefined = undefined;
        try {
          const arr = JSON.parse(a.slides || '[]');
          if (Array.isArray(arr)) slides_count = arr.length;
        } catch {}
        return {
          ...a,
          slides_count,
          created_by_name:
            a.profiles?.first_name && a.profiles?.last_name
              ? `${a.profiles.first_name} ${a.profiles.last_name}`
              : null,
        };
      });
    },
    enabled: !!currentOrganization?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAnnouncement(id: string) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: async (): Promise<AnnouncementWithMeta> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('announcements')
        .select(`*, profiles!announcements_created_by_fkey2(first_name,last_name)`) 
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Announcement not found');
      return {
        ...data,
        created_by_name:
          (data as any).profiles?.first_name && (data as any).profiles?.last_name
            ? `${(data as any).profiles.first_name} ${(data as any).profiles.last_name}`
            : null,
      };
    },
    enabled: !!currentOrganization?.id && !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAnnouncementPublic(id: string) {
  return useQuery({
    queryKey: announcementKeys.detail(`public-${id}`),
    queryFn: async (): Promise<AnnouncementWithMeta> => {
      const { data, error } = await supabase
        .from('announcements')
        .select(`*`) 
        .eq('id', id)
        .eq('is_deleted', false)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Announcement not found');
      return data as AnnouncementWithMeta;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Legacy slide hooks removed in favor of JSON-based storage on announcements.slides

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateAnnouncementInput): Promise<Announcement> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User authentication required');
      if (!input.title || input.title.length > 100) throw new Error('Title is required and must be <= 100 characters');
      if (!input.description || input.description.length > 255) throw new Error('Description is required and must be <= 255 characters');
      const payload = { ...input, organization_id: currentOrganization.id, created_by: user.id };
      const { data, error } = await supabase.from('announcements').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      toast.success('Announcement created');
    },
    onError: (e) => {
      console.error(e);
      toast.error('Failed to create announcement');
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateAnnouncementInput }): Promise<Announcement> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('announcements')
        .update({ ...updates, last_updated_by: user?.id || null })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail(data.id) });
      toast.success('Announcement updated');
    },
    onError: () => toast.error('Failed to update announcement'),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { error } = await supabase
        .from('announcements')
        .update({ is_deleted: true, last_updated_by: user?.id || null })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      toast.success('Announcement deleted');
    },
    onError: () => toast.error('Failed to delete announcement'),
  });
}

// Per-slide create/update/delete/reorder removed
