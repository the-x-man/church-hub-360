import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/shared/DatePicker';
import { BranchSelector } from '@/components/shared/BranchSelector';
import { EditableField } from '@/components/shared/EditableField';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import type { ExpenseFormData, PaymentMethod } from '@/types/finance';
import { format } from 'date-fns';
import { PledgeOptionsSelect } from '@/components/finance/pledges/PledgeOptionsSelect';
import { useExpensePreferences } from '@/hooks/finance/useExpensePreferences';
import { paymentMethodOptions } from '@/components/finance/constants';
import type { MemberSearchResult } from '@/hooks/useMemberSearch';

interface ExpenseFormProps {
  data: ExpenseFormData;
  onChange: (next: ExpenseFormData) => void;
  onApprovedByChange: (val: string | null) => void;
  approvalDate: string;
  onApprovalDateChange: (val: string) => void;
  approvedTypeaheadValueSingle: MemberSearchResult[];
  organizationId: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  data,
  onChange,
  onApprovedByChange,
  approvalDate,
  onApprovalDateChange,
  approvedTypeaheadValueSingle,
  organizationId,
  onSubmit,
  submitLabel = 'Save',
}) => {
  const {
    categoryOptions,
    categoryKeys,
    getPurposeOptions,
    addPurpose,
  } = useExpensePreferences();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) =>
    setErrors((prev) => {
      const { [key]: _omit, ...rest } = prev;
      return rest;
    });

  const validateForm = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};

    if (!data.amount || data.amount <= 0) {
      nextErrors.amount = 'Amount must be greater than zero.';
    }

    if (!data.branch_id) {
      nextErrors.branch_id = 'Please select a branch.';
    }

    if (!data.category) {
      nextErrors.category = 'Please select a category.';
    }

    if (!data.description?.trim()) {
      nextErrors.description = 'Please provide a description.';
    }

    if (!data.date) {
      nextErrors.date = 'Please provide a date.';
    }

    if (!data.payment_method) {
      nextErrors.payment_method = 'Please select a payment method.';
    }

    if (data.payment_method === 'cheque' && !data.check_number?.trim()) {
      nextErrors.check_number =
        'Cheque number is required for cheque payments.';
    }

    return nextErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Branch *</Label>
          <BranchSelector
            variant="single"
            value={data.branch_id || undefined}
            onValueChange={(v) =>
              onChange({
                ...data,
                branch_id: (v as string | undefined) ?? null,
              })
            }
            placeholder="Select branch"
          />
          {errors.branch_id && (
            <p className="text-destructive text-sm mt-1" aria-live="polite">
              {errors.branch_id}
            </p>
          )}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={data.amount}
            onChange={(e) =>
              onChange({
                ...data,
                amount: parseFloat(e.target.value) || 0,
              })
            }
            onBlur={() => clearError('amount')}
            aria-invalid={!!errors.amount}
            required
          />
          {errors.amount && (
            <p className="text-destructive text-sm mt-1" aria-live="polite">
              {errors.amount}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select
            value={data.category as any}
            onValueChange={(value) =>
              onChange({ ...data, category: value as any, purpose: '' })
            }
          >
            <SelectTrigger className="w-full" aria-invalid={!!errors.category}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryKeys.map((key: string, idx: number) => (
                <SelectItem key={key} value={key as any}>
                  {categoryOptions[idx]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-destructive text-sm mt-1" aria-live="polite">
              {errors.category}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <PledgeOptionsSelect
            label="Purpose"
            value={data.purpose || null}
            options={getPurposeOptions(data.category)}
            onChange={(val) => onChange({ ...data, purpose: val || '' })}
            onCreateOption={async (label) => {
              await addPurpose(data.category as any, label);
            }}
            placeholder="Search purposes..."
            buttonClassName="w-full justify-start"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Brief description of the expense"
          onBlur={() => clearError('description')}
          aria-invalid={!!errors.description}
          required
        />
        {errors.description && (
          <p className="text-destructive text-sm mt-1" aria-live="polite">
            {errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date *</Label>
          <DatePicker
            value={data.date}
            onChange={(date) => onChange({ ...data, date })}
            label={undefined}
            formatDateLabel={(date) => format(date, 'MMM dd, yyyy')}
          />
          {errors.date && (
            <p className="text-destructive text-sm mt-1" aria-live="polite">
              {errors.date}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method *</Label>
          <Select
            value={data.payment_method}
            onValueChange={(value: PaymentMethod) =>
              onChange({ ...data, payment_method: value })
            }
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={!!errors.payment_method}
            >
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
          {errors.payment_method && (
            <p className="text-destructive text-sm mt-1" aria-live="polite">
              {errors.payment_method}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <EditableField
            label="Approved By"
            value={approvedTypeaheadValueSingle[0]?.display_name || 'None'}
            renderEditor={() => (
              <MemberSearchTypeahead
                organizationId={organizationId}
                value={approvedTypeaheadValueSingle}
                onChange={(items) =>
                  onApprovedByChange(items[0]?.id ? String(items[0].id) : null)
                }
                placeholder="Search members"
              />
            )}
            startInEdit={false}
          />
        </div>

        <div className="space-y-2">
          <Label>Approval Date</Label>
          <DatePicker
            value={approvalDate}
            onChange={(date) => onApprovalDateChange(date)}
            label={undefined}
            disableFuture={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor</Label>
          <Input
            id="vendor"
            value={data.vendor || ''}
            onChange={(e) => onChange({ ...data, vendor: e.target.value })}
            placeholder="Vendor or supplier name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="receiptNumber">Receipt Number</Label>
          <Input
            id="receiptNumber"
            value={data.receipt_number || ''}
            onChange={(e) =>
              onChange({ ...data, receipt_number: e.target.value })
            }
            placeholder="Receipt or invoice number"
          />
        </div>
      </div>

      {data.payment_method === 'cheque' && (
        <div className="space-y-2">
          <Label htmlFor="checkNumber">Cheque Number *</Label>
          <Input
            id="checkNumber"
            value={data.check_number || ''}
            onChange={(e) =>
              onChange({ ...data, check_number: e.target.value })
            }
            placeholder="Enter check number"
            onBlur={() => clearError('check_number')}
            aria-invalid={!!errors.check_number}
            required
          />
          {errors.check_number && (
            <p className="text-destructive text-sm mt-1" aria-live="polite">
              {errors.check_number}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={data.notes || ''}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="Additional notes or details"
          rows={3}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
};

export default ExpenseForm;
