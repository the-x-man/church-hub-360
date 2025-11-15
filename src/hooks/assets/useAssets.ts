import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Asset, AssetWithMeta, CreateAssetInput, UpdateAssetInput } from '@/types/assets';

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (organizationId: string, params: string) => [...assetKeys.lists(), organizationId, params] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
};

export interface AssetsFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: string;
  location?: string;
  assigned_to_type?: 'member' | 'group';
  assigned_to_member_id?: string;
  assigned_to_group_id?: string;
}

export function useAssets(params: AssetsFilterParams = { page: 1, pageSize: 10 }) {
  const { currentOrganization } = useOrganization();
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const queryKeyParams = JSON.stringify({ ...params, page, pageSize });

  return useQuery({
    queryKey: assetKeys.list(currentOrganization?.id || '', queryKeyParams),
    queryFn: async (): Promise<{ data: AssetWithMeta[]; total: number; page: number; pageSize: number; totalPages: number; }> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');

      let query = supabase
        .from('assets')
        .select('*', { count: 'exact' })
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (params.category) query = query.eq('category', params.category);
      if (params.status) query = query.eq('status', params.status);
      if (params.location) query = query.ilike('location', `%${params.location}%`);
      if (params.assigned_to_type) query = query.eq('assigned_to_type', params.assigned_to_type);
      if (params.assigned_to_member_id) query = query.eq('assigned_to_member_id', params.assigned_to_member_id);
      if (params.assigned_to_group_id) query = query.eq('assigned_to_group_id', params.assigned_to_group_id);
      if (params.search) {
        const s = params.search.trim();
        if (s) {
          query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
        }
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      return { data: (data || []) as AssetWithMeta[], total, page, pageSize, totalPages };
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAsset(id: string) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: async (): Promise<AssetWithMeta> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Asset not found');
      return data as AssetWithMeta;
    },
    enabled: !!currentOrganization?.id && !!id,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  return useMutation({
    mutationFn: async (input: CreateAssetInput): Promise<Asset> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const payload = { ...input, organization_id: currentOrganization.id };
      const { data, error } = await supabase.from('assets').insert(payload).select().single();
      if (error) throw error;
      return data as Asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateAssetInput }): Promise<Asset> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('assets')
        .update({ ...updates })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();
      if (error) throw error;
      return data as Asset;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(data.id) });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { error } = await supabase
        .from('assets')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}
