import React from 'react';
import type { GroupFormData } from '../../hooks/useGroups';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { DatePicker } from '../shared/DatePicker';
import { SingleBranchSelector } from '../shared/BranchSelector';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  group: GroupFormData;
  onGroupChange: React.Dispatch<React.SetStateAction<GroupFormData>>;
  isEditing: boolean;
  isLoading?: boolean;
}

export function GroupModal({
  isOpen,
  onClose,
  onSubmit,
  group,
  onGroupChange,
  isEditing,
  isLoading = false,
}: GroupModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (group.name.trim() && group.type) {
      // For temporal groups, both start_date and end_date are required
      if (group.type === 'temporal' && (!group.start_date || !group.end_date)) {
        return;
      }
      onSubmit();
    }
  };

  const updateFormData = (field: keyof GroupFormData, value: any) => {
    onGroupChange((prev) => {
      const updated = { ...prev, [field]: value };

      // Clear start and end dates when changing from temporal to permanent
      if (
        field === 'type' &&
        value === 'permanent' &&
        prev.type === 'temporal'
      ) {
        updated.start_date = undefined;
        updated.end_date = undefined;
      }

      return updated;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Group' : 'Add New Group'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={group.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="e.g., Finance Group"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={group.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Brief description of this group's purpose"
              rows={3}
            />
          </div>

          {/* Group Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Group Type *</Label>
            <Select
              value={group.type}
              onValueChange={(value) => updateFormData('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="temporal">Temporal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Branch Selection */}
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <SingleBranchSelector
              value={group.branch_id}
              onValueChange={(value) => updateFormData('branch_id', value)}
              placeholder="Select branch..."
              allowClear={true}
              showActiveOnly={true}
            />
          </div>

          {/* Start Date and End Date - Only show for temporal groups */}
          {group.type === 'temporal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DatePicker
                  label="Start Date *"
                  value={group.start_date || ''}
                  onChange={(date) => updateFormData('start_date', date)}
                  placeholder="Select start date"
                  id="start_date"
                />
              </div>
              <div className="space-y-2">
                <DatePicker
                  label="End Date *"
                  value={group.end_date || ''}
                  onChange={(date) => updateFormData('end_date', date)}
                  placeholder="Select end date"
                  id="end_date"
                  minDate={group.start_date || undefined}
                />
              </div>
            </div>
          )}

          {group.type === 'temporal' && (
            <p className="text-sm text-muted-foreground">
              Both start and end dates are required for temporal groups
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !group.name.trim() ||
                !group.type ||
                (group.type === 'temporal' &&
                  (!group.start_date || !group.end_date))
              }
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>{isEditing ? 'Update Group' : 'Add Group'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
