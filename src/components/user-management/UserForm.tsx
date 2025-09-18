import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MultipleSelector, { type Option } from '@/components/ui/multiselect';
import { useRoleCheck } from '@/components/auth/RoleGuard';
import type { UserRole } from '@/lib/auth';
import type { UserWithRelations } from '@/types/user-management';

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  selectedBranchIds: string[];
  assignAllBranches?: boolean;
}

interface UserFormProps {
  mode: 'create' | 'edit';
  user?: UserWithRelations;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  branches: Branch[];
  isLoading?: boolean;
}

export function UserForm({
  mode,
  user,
  onSubmit,
  onCancel,
  branches,
  isLoading = false,
}: UserFormProps) {
  const { canManageAllData, canManageUserData, isOwner } = useRoleCheck();
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'read',
    selectedBranchIds: [],
    assignAllBranches: false,
  });

  useEffect(() => {
    if (mode === 'edit' && user) {
      const userBranchIds = user.user_branches?.map(ub => ub.branch_id).filter(Boolean) || [];
      const activeBranchIds = branches.filter(b => b.is_active).map(b => b.id);
      const hasAllBranches = activeBranchIds.length > 0 && 
        activeBranchIds.every(id => userBranchIds.includes(id));
      
      const userRole = user.user_organizations?.[0]?.role || 'read';
      
      setFormData({
        email: user.profile.email || '',
        firstName: user.profile.first_name || '',
        lastName: user.profile.last_name || '',
        role: userRole,
        selectedBranchIds: userBranchIds.filter((id): id is string => id !== null),
        assignAllBranches: hasAllBranches,
      });
    }
  }, [mode, user, branches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that branches are selected for write, read, and branch_admin users
    if (
      ['write', 'read', 'branch_admin'].includes(formData.role) &&
      formData.selectedBranchIds.length === 0 &&
      !formData.assignAllBranches
    ) {
      return; // Form validation should handle this
    }

    // Admin users don't need branch validation as they get all branches automatically

    onSubmit(formData);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role,
      // Clear branches for admin roles (they get all branches automatically)
      // Keep existing branches for other roles
      assignAllBranches: role === 'admin' ? false : prev.assignAllBranches,
      selectedBranchIds: role === 'admin' ? [] : prev.selectedBranchIds,
    }));
  };

  const requiresBranch = ['write', 'read', 'branch_admin'].includes(formData.role) && !formData.assignAllBranches;
  
  const canBeAssignedAllBranches = ['branch_admin', 'write', 'read'].includes(formData.role);
  
  const handleAssignAllBranchesChange = (checked: boolean) => {
    const activeBranchIds = branches.filter(b => b.is_active).map(b => b.id);
    setFormData(prev => ({
      ...prev,
      assignAllBranches: checked,
      selectedBranchIds: checked ? activeBranchIds : [],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className='space-y-1'>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          disabled={mode === 'edit'}
          required
          className={mode === 'edit' ? 'bg-muted' : ''}
        />
        {mode === 'edit' && (
          <p className="text-xs text-muted-foreground mt-1">
            Email cannot be changed
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className='space-y-1'>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, firstName: e.target.value }))
            }
            required
          />
        </div>
        <div className='space-y-1'>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            required
          />
        </div>
      </div>

      <div className='space-y-1'>
        <Label htmlFor="role">Role</Label>
        <Select key={`role-${formData.role}-${mode}`} value={formData.role} onValueChange={handleRoleChange}>
          <SelectTrigger className='w-[250px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {canManageAllData() && (
              <>
                {isOwner() && <SelectItem value="admin">Admin</SelectItem>}
                <SelectItem value="branch_admin">Branch Admin</SelectItem>
                <SelectItem value="write">Write</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </>
            )}
            {!canManageAllData() && canManageUserData() && (
              <>
                {/* Branch admins can only assign write and read roles to others */}
                <SelectItem value="write">Editor</SelectItem>
                <SelectItem value="read">Viewer</SelectItem>
              </>
            )}
            {/* Fallback: Show current user's role if it's not in the available options */}
            {mode === 'edit' && user && !canManageAllData() && !canManageUserData() && (
              <SelectItem value={formData.role} disabled>
                {formData.role.charAt(0).toUpperCase() + formData.role.slice(1).replace('_', ' ')}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {canBeAssignedAllBranches && canManageAllData() && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm">
            <Checkbox
              id="assignAllBranches"
              checked={formData.assignAllBranches}
              onCheckedChange={handleAssignAllBranchesChange}
            />
            <Label htmlFor="assignAllBranches">
              Assign all branches
            </Label>
          </div>
          
         
        </div>
      )}
      
      {requiresBranch && (
        <div className='space-y-1'>
          <Label htmlFor="branches">
            Branches <span className="text-red-500">*</span>
          </Label>
          <MultipleSelector
            value={formData.selectedBranchIds.map(id => {
              const branch = branches.find(b => b.id === id);
              return { value: id, label: branch?.name || id };
            })}
            onChange={(options: Option[]) => {
              setFormData(prev => ({
                ...prev,
                selectedBranchIds: options.map(option => option.value)
              }));
            }}
            defaultOptions={branches
              .filter(branch => branch.is_active)
              .map(branch => ({
                value: branch.id,
                label: branch.name
              }))}
            placeholder="Select branches"
            emptyIndicator={<p className="text-center text-sm">No branches found</p>}
            className="w-full"
          />
        </div>
      )}

      <div className="flex space-x-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading
            ? mode === 'create'
              ? 'Creating...'
              : 'Updating...'
            : mode === 'create'
            ? 'Create User'
            : 'Update User'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
