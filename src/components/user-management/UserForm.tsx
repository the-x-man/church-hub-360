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
import { useRoleCheck } from '@/registry/access/RoleGuard';
import type { UserRole } from '@/lib/auth';
import type { UserWithRelations } from '@/types/user-management';
import type { VisibilityOverrides } from '@/types/access-control';
import { getRoleDefaultSections, getDefaultCapability, getToggleDisablesForRole } from '@/registry/access/policy';

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
  visibilityOverrides?: VisibilityOverrides;
  canCreateUsers?: boolean;
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
    role: 'branch_admin',
    selectedBranchIds: [],
    assignAllBranches: false,
    visibilityOverrides: { sections: {} },
    canCreateUsers: true,
  });
  const [disabledMap, setDisabledMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (mode === 'edit' && user) {
      const userBranchIds = user.user_branches?.map(ub => ub.branch_id).filter(Boolean) || [];
      const activeBranchIds = branches.filter(b => b.is_active).map(b => b.id);
      const hasAllBranches = activeBranchIds.length > 0 && 
        activeBranchIds.every(id => userBranchIds.includes(id));
      
      const userRole = user.user_organizations?.[0]?.role || 'branch_admin';
      const vis = user.user_organizations?.[0]?.visibility_overrides || {};
      const canCreateUsers = user.user_organizations?.[0]?.can_create_users ?? true;
      
      setFormData({
        email: user.profile.email || '',
        firstName: user.profile.first_name || '',
        lastName: user.profile.last_name || '',
        role: userRole,
        selectedBranchIds: userBranchIds.filter((id): id is string => id !== null),
        assignAllBranches: hasAllBranches,
        visibilityOverrides: vis,
        canCreateUsers,
      });
      setDisabledMap(disabledForRole(userRole));
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

  const defaultsForRole = (role: UserRole): VisibilityOverrides => ({ sections: getRoleDefaultSections(role) });

  const disabledForRole = (role: UserRole): Record<string, boolean> => getToggleDisablesForRole(role);

  const handleRoleChange = (role: UserRole) => {
    const defaults = defaultsForRole(role);
    setFormData((prev) => ({
      ...prev,
      role,
      assignAllBranches: role === 'admin' ? false : prev.assignAllBranches,
      selectedBranchIds: role === 'admin' ? [] : prev.selectedBranchIds,
      visibilityOverrides: defaults,
      canCreateUsers: getDefaultCapability(role).can_create_users ?? prev.canCreateUsers,
    }));
    setDisabledMap(disabledForRole(role));
  };

  useEffect(() => {
    if (mode === 'create') {
      const defaults = defaultsForRole(formData.role);
      setFormData(prev => ({ ...prev, visibilityOverrides: defaults, canCreateUsers: getDefaultCapability(formData.role).can_create_users }));
      setDisabledMap(disabledForRole(formData.role));
    }
  }, [mode]);

  const requiresBranch = ['write', 'read', 'branch_admin', 'finance_admin', 'attendance_manager', 'attendance_rep'].includes(formData.role) && !formData.assignAllBranches;
  
  const canBeAssignedAllBranches = ['branch_admin', 'write', 'read', 'finance_admin', 'attendance_manager', 'attendance_rep'].includes(formData.role);
  
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
                <SelectItem value="finance_admin">Finance Admin</SelectItem>
                <SelectItem value="attendance_manager">Attendance Manager</SelectItem>
                <SelectItem value="attendance_rep">Attendance Rep</SelectItem>
                {/* <SelectItem value="write">Write</SelectItem> */}
                {/* <SelectItem value="read">Read</SelectItem> */}
              </>
            )}
            {!canManageAllData() && canManageUserData() && (
              <>
                {/* Branch admins can only assign write and read roles to others */}
                {/* <SelectItem value="write">Editor</SelectItem> */}
                {/* <SelectItem value="read">Viewer</SelectItem> */}
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



      {isOwner() && (
        <div className="space-y-4 border rounded-md p-4">
          <div>
            <div className="font-medium">Access control</div>
            <div className="text-xs text-muted-foreground">Allow user access to manage</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 text-sm">
              <Checkbox
                id="override-branches"
                checked={!!formData.visibilityOverrides?.sections?.branches}
                disabled={!!disabledMap.branches}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    visibilityOverrides: {
                      sections: {
                        ...(prev.visibilityOverrides?.sections || {}),
                        branches: !!checked,
                      },
                    },
                  }));
                }}
              />
              <Label htmlFor="override-branches">Branches</Label>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Checkbox
                id="override-people"
                checked={!!formData.visibilityOverrides?.sections?.people?.enabled}
                disabled={!!disabledMap.people_enabled}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    visibilityOverrides: {
                      sections: {
                        ...(prev.visibilityOverrides?.sections || {}),
                        people: { enabled: !!checked, attendance: prev.visibilityOverrides?.sections?.people?.attendance },
                      },
                    },
                  }));
                }}
              />
              <Label htmlFor="override-people">People</Label>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Checkbox
                id="override-people-attendance"
                checked={!!formData.visibilityOverrides?.sections?.people?.attendance}
                disabled={!!disabledMap.people_attendance}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    visibilityOverrides: {
                      sections: {
                        ...(prev.visibilityOverrides?.sections || {}),
                        people: { ...(prev.visibilityOverrides?.sections?.people || {}), attendance: !!checked },
                      },
                    },
                  }));
                }}
              />
              <Label htmlFor="override-people-attendance">Attendance (People)</Label>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Checkbox
                id="override-finance"
                checked={!!formData.visibilityOverrides?.sections?.finance?.enabled}
                disabled={!!disabledMap.finance}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    visibilityOverrides: {
                      sections: {
                        ...(prev.visibilityOverrides?.sections || {}),
                        finance: { enabled: !!checked },
                      },
                    },
                  }));
                }}
              />
              <Label htmlFor="override-finance">Finance</Label>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Checkbox
                id="override-events"
                checked={!!formData.visibilityOverrides?.sections?.events}
                disabled={!!disabledMap.events}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    visibilityOverrides: {
                      sections: {
                        ...(prev.visibilityOverrides?.sections || {}),
                        events: !!checked,
                      },
                    },
                  }));
                }}
              />
              <Label htmlFor="override-events">Events and Activities</Label>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Checkbox
                id="override-announcements"
                checked={!!formData.visibilityOverrides?.sections?.announcements}
                disabled={!!disabledMap.announcements}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    visibilityOverrides: {
                      sections: {
                        ...(prev.visibilityOverrides?.sections || {}),
                        announcements: !!checked,
                      },
                    },
                  }));
                }}
              />
              <Label htmlFor="override-announcements">Announcements</Label>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Checkbox
                id="override-assets"
                checked={!!formData.visibilityOverrides?.sections?.assets}
                disabled={!!disabledMap.assets}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    visibilityOverrides: {
                      sections: {
                        ...(prev.visibilityOverrides?.sections || {}),
                        assets: !!checked,
                      },
                    },
                  }));
                }}
              />
              <Label htmlFor="override-assets">Assets management</Label>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Checkbox
                id="override-user-mgmt"
                checked={!!formData.visibilityOverrides?.sections?.user_management}
                disabled={!!disabledMap.user_management}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    visibilityOverrides: {
                      sections: {
                        ...(prev.visibilityOverrides?.sections || {}),
                        user_management: !!checked,
                      },
                    },
                  }));
                }}
              />
              <Label htmlFor="override-user-mgmt">User management</Label>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Checkbox
                id="override-settings"
                checked={!!formData.visibilityOverrides?.sections?.settings}
                disabled={!!disabledMap.settings}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    visibilityOverrides: {
                      sections: {
                        ...(prev.visibilityOverrides?.sections || {}),
                        settings: !!checked,
                      },
                    },
                  }));
                }}
              />
              <Label htmlFor="override-settings">Settings</Label>
            </div>
          </div>

          
        </div>
      )}

      {(formData.role === 'admin' || formData.role === 'branch_admin' ) && (
        <div className="flex items-center space-x-2 text-sm my-6">
          <Checkbox
            id="can-create-users"
            checked={!!formData.canCreateUsers}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canCreateUsers: !!checked }))}
          />
          <Label htmlFor="can-create-users">Allow this admin to create users</Label>
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
