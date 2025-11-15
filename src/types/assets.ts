export type AssetStatus = 'Active' | 'In Storage' | 'Damaged' | 'Retired';

export interface Asset {
  id: string;
  organization_id: string;
  branch_id?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  location?: string | null;
  assigned_to_member_id?: string | null;
  assigned_to_group_id?: string | null;
  assigned_to_type?: 'member' | 'group' | null;
  images: string[];
  purchase_date?: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface AssetWithMeta extends Asset {
  assigned_to_name?: string | null;
}

export interface CreateAssetInput {
  name: string;
  description?: string;
  category?: string;
  status?: AssetStatus | string;
  location?: string;
  branch_id?: string | null;
  assigned_to_member_id?: string | null;
  assigned_to_group_id?: string | null;
  assigned_to_type?: 'member' | 'group' | null;
  images?: string[];
  purchase_date?: string | null;
}

export interface UpdateAssetInput extends Partial<CreateAssetInput> {}
