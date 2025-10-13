import React from 'react';
import type { CommitteeFormData } from '../../hooks/useCommittees';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePicker } from '../shared/DatePicker';
import { SingleBranchSelector } from '../shared/BranchSelector';

interface CommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  committee: CommitteeFormData;
  onCommitteeChange: React.Dispatch<React.SetStateAction<CommitteeFormData>>;
  isEditing: boolean;
  isLoading?: boolean;
}

export function CommitteeModal({
  isOpen,
  onClose,
  onSubmit,
  committee,
  onCommitteeChange,
  isEditing,
  isLoading = false,
}: CommitteeModalProps) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (committee.name.trim() && committee.type) {
      // For temporal committees, both start_date and end_date are required
      if (committee.type === 'temporal' && (!committee.start_date || !committee.end_date)) {
        return;
      }
      onSubmit();
    }
  };

  const updateFormData = (field: keyof CommitteeFormData, value: any) => {
    onCommitteeChange((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Clear start and end dates when changing from temporal to permanent
      if (field === 'type' && value === 'permanent' && prev.type === 'temporal') {
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
            {isEditing ? 'Edit Committee' : 'Add New Committee'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Committee Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Committee Name *</Label>
            <Input
              id="name"
              value={committee.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="e.g., Finance Committee"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={committee.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Brief description of this committee's purpose"
              rows={3}
            />
          </div>

          {/* Committee Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Committee Type *</Label>
            <Select
              value={committee.type}
              onValueChange={(value) => updateFormData('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select committee type" />
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
              value={committee.branch_id}
              onValueChange={(value) => updateFormData('branch_id', value)}
              placeholder="Select branch..."
              allowClear={true}
              showActiveOnly={true}
            />
          </div>

          {/* Start Date and End Date - Only show for temporal committees */}
          {committee.type === 'temporal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DatePicker
                  label="Start Date *"
                  value={committee.start_date || ''}
                  onChange={(date) => updateFormData('start_date', date)}
                  placeholder="Select start date"
                  id="start_date"
                />
              </div>
              <div className="space-y-2">
                <DatePicker
                  label="End Date *"
                  value={committee.end_date || ''}
                  onChange={(date) => updateFormData('end_date', date)}
                  placeholder="Select end date"
                  id="end_date"
                  minDate={committee.start_date || undefined}
                />
              </div>
            </div>
          )}

          {committee.type === 'temporal' && (
            <p className="text-sm text-muted-foreground">
              Both start and end dates are required for temporal committees
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !committee.name.trim() || !committee.type || (committee.type === 'temporal' && (!committee.start_date || !committee.end_date))}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>{isEditing ? 'Update Committee' : 'Add Committee'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}