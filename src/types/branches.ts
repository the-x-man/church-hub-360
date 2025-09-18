// Branch types for the branch management system

// Branch interface matching the database schema
export interface Branch {
  id: string;
  name: string;
  location: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization_id: string;
  contact: string | null;
}

// User branch relationship interface
export interface UserBranch {
  id: string;
  user_id: string;
  branch_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  branch?: Branch; // Optional populated branch data
}

// Branch with user permissions (for context)
export interface BranchWithPermissions extends Branch {
  user_can_edit: boolean;
  user_can_delete: boolean;
}

// Branch creation/update types
export interface CreateBranchData {
  name: string;
  location: string;
  description?: string;
  contact?: string;
  is_active?: boolean;
  organization_id: string;
}

export interface UpdateBranchData extends Partial<Omit<CreateBranchData, 'organization_id'>> {
  id: string;
}

// User branch assignment types
export interface CreateUserBranchData {
  user_id: string;
  branch_id: string;
  organization_id: string;
}

export interface UpdateUserBranchData extends Partial<Omit<CreateUserBranchData, 'user_id' | 'organization_id'>> {
  id: string;
}

// Branch context types
export interface BranchContextType {
  currentBranch: Branch | null;
  userBranches: Branch[];
  selectedBranchId: string | null;
  hasAllBranches: boolean;
  isLoading: boolean;
  error: string | null;
  selectBranch: (branchId: string | null) => void;
  createBranch: (data: CreateBranchData) => Promise<Branch>;
  updateBranch: (data: UpdateBranchData) => Promise<Branch>;
  deleteBranch: (branchId: string) => Promise<void>;
  refreshBranches: () => Promise<void>;
  assignUserToBranch: (data: CreateUserBranchData) => Promise<void>;
  removeUserFromBranch: (userBranchId: string) => Promise<void>;
  clearBranchData: () => void;
}

// Branch filter types
export type BranchStatusFilter = 'all' | 'active' | 'inactive';

export interface BranchFilters {
  search: string;
  status: BranchStatusFilter;
  organizationId?: string;
}

// Database types extension for branches
export interface Database {
  public: {
    Tables: {
      branches: {
        Row: Branch;
        Insert: Omit<Branch, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Branch, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_branches: {
        Row: UserBranch;
        Insert: Omit<UserBranch, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserBranch, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}