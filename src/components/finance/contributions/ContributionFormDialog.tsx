import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/shared/DatePicker';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { GroupSelect } from '@/components/finance/GroupSelect';
import { TagItemSelect } from '@/components/finance/TagItemSelect';
import type {
  PaymentMethod,
  ContributionDonationFormData,
  ExtendedIncomeType,
} from '../../../types/finance';
import { OccasionSessionSelector } from '@/components/shared/OccasionSessionSelector';

interface ContributionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  formData: ContributionDonationFormData;
  onFormDataChange: (
    updater: (
      prev: ContributionDonationFormData
    ) => ContributionDonationFormData
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  currentOrganizationId?: string;
  memberTypeaheadValue: any[];
  onMemberTypeaheadChange: (members: any[]) => void;
  paymentMethodOptions: { value: PaymentMethod; label: string }[];
  extendedIncomeTypeOptions: { value: ExtendedIncomeType; label: string }[];
  occasionTypeaheadValue: any[];
  onOccasionTypeaheadChange: (occasions: any[]) => void;
  sessionTypeaheadValue: any[];
  onSessionTypeaheadChange: (sessions: any[]) => void;
}

export const ContributionFormDialog: React.FC<ContributionFormDialogProps> = ({
  open,
  onOpenChange,
  mode,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
  currentOrganizationId,
  memberTypeaheadValue,
  onMemberTypeaheadChange,
  paymentMethodOptions,
  extendedIncomeTypeOptions,
  occasionTypeaheadValue,
  onOccasionTypeaheadChange,
  sessionTypeaheadValue,
  onSessionTypeaheadChange,
}) => {
  const isAdd = mode === 'add';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isAdd ? 'Add New Record' : 'Edit Record'}</DialogTitle>
          <DialogDescription>
            {isAdd
              ? 'Record a new contribution or donation.'
              : 'Update the record information.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recordType">Record Type *</Label>
              <Select
                value={formData.income_type}
                onValueChange={(value) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    income_type: value as any,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contribution">Contribution</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extendedType">Income Type *</Label>
              <Select
                value={formData.extended_income_type}
                onValueChange={(value) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    extended_income_type: value as ExtendedIncomeType,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {extendedIncomeTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type *</Label>
              <Select
                value={formData.source_type}
                onValueChange={(value) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    source_type: value as any,
                    member_id: undefined,
                    group_id: undefined,
                    tag_item_id: undefined,
                    source: '',
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="tag_item">Tag Item</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              {formData.source_type === 'member' && (
                <div className="space-y-2">
                  <Label>Select Member *</Label>
                  <MemberSearchTypeahead
                    organizationId={currentOrganizationId || ''}
                    value={memberTypeaheadValue}
                    onChange={(members) => {
                      onMemberTypeaheadChange(members);
                      const first = (members as any[])[0];
                      onFormDataChange((prev) => ({
                        ...prev,
                        member_id: first?.id,
                      }));
                    }}
                    multiSelect={false}
                  />
                </div>
              )}
              {formData.source_type === 'group' && (
                <GroupSelect
                  label="Select Group *"
                  value={formData.group_id}
                  onChange={(id) =>
                    onFormDataChange((prev) => ({ ...prev, group_id: id }))
                  }
                />
              )}
              {formData.source_type === 'tag_item' && (
                <TagItemSelect
                  label="Select Tag Item *"
                  value={formData.tag_item_id}
                  onChange={(id) =>
                    onFormDataChange((prev) => ({ ...prev, tag_item_id: id }))
                  }
                />
              )}
              {formData.source_type === 'other' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceName">Name *</Label>
                    <Input
                      id="sourceName"
                      value={formData.source || ''}
                      onChange={(e) =>
                        onFormDataChange((prev) => ({
                          ...prev,
                          source: e.target.value,
                        }))
                      }
                      placeholder="Enter name"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <OccasionSessionSelector
                occasionValue={occasionTypeaheadValue}
                onOccasionChange={(occasions) => {
                  onOccasionTypeaheadChange(occasions);
                  const first = (occasions as any[])[0];
                  onFormDataChange((prev) => ({
                    ...prev,
                    attendance_occasion_id: first?.id,
                    attendance_session_id: undefined,
                  }));
                }}
                sessionValue={sessionTypeaheadValue}
                onSessionChange={(sessions) => {
                  onSessionTypeaheadChange(sessions);
                  const first = (sessions as any[])[0];
                  onFormDataChange((prev) => ({
                    ...prev,
                    attendance_session_id: first?.id,
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value: PaymentMethod) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    payment_method: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <DatePicker
                value={formData.date}
                onChange={(date) =>
                  onFormDataChange((prev) => ({ ...prev, date }))
                }
                label=""
                placeholder="Pick a date"
                align="start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="envelopeNumber">Envelope Number (optional)</Label>
              <Input
                id="envelopeNumber"
                value={formData.envelope_number}
                onChange={(e) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    envelope_number: e.target.value,
                  }))
                }
                placeholder="Enter envelope number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                onFormDataChange((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Brief description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                onFormDataChange((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isAdd
                  ? 'Adding'
                  : 'Updating'
                : isAdd
                ? 'Add Record'
                : 'Update Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
