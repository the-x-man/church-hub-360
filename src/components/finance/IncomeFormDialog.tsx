import { GroupSelect } from '@/components/finance/GroupSelect';
import { TagItemSelect } from '@/components/finance/TagItemSelect';
import { DateTimePicker } from '@/components/shared/DateTimePicker';
import { EditableField } from '@/components/shared/EditableField';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { OccasionSessionSelector } from '@/components/shared/OccasionSessionSelector';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { extendedIncomeTypes } from '@/constants/finance/income';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  useOccasionDetails,
  useSessionDetails,
  type OccasionSearchResult,
  type SessionSearchResult,
} from '@/hooks/attendance/useAttendanceSearch';
import { useCreateIncome, useUpdateIncome, type CreateIncomeInput } from '@/hooks/finance/income';
import { useGroup } from '@/hooks/useGroups';
import { useMember } from '@/hooks/useMemberQueries';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import { supabase } from '@/utils/supabase';
import type {
  IncomeResponseRow,
  IncomeType,
} from '@/types/finance';
import React, { useEffect, useMemo, useState } from 'react';
import { paymentMethodOptions } from './constants';
import { BranchSelector } from '@/components/shared/BranchSelector';


type IncomeFieldKey =
  | 'envelope_number'
  | 'receipt_number'
  | 'occasion_name'
  | 'attendance_occasion_id'
  | 'attendance_session_id'
  | 'description'
  | 'notes'
  | 'source_type'
  | 'member_id'
  | 'group_id'
  | 'tag_item_id'
  | 'source';

interface IncomeFormDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: 'add' | 'edit';
  // Accept either a partial record (for edit) or a creation payload
  initialData?: Partial<IncomeResponseRow & { id?: string }> | Partial<CreateIncomeInput>;
  // Toggle visibility of specific fields (defaults inferred from income_type)
  fieldVisibility?: Partial<Record<IncomeFieldKey, boolean>>;
  title?: string;
  onSuccess?: (record?: IncomeResponseRow) => void;
  // Allow restricting income type options per usage; defaults to all
  allowedIncomeTypes?: IncomeType[];
}

export const IncomeFormDialog: React.FC<IncomeFormDialogProps> = ({
  open,
  onOpenChange,
  mode = 'add',
  initialData,
  fieldVisibility,
  title,
  onSuccess,
  allowedIncomeTypes,
}) => {
  const isAdd = mode === 'add';

  // Controlled/uncontrolled dialog support
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === 'boolean';
  const computedOpen = isControlled ? !!open : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) onOpenChange?.(val);
    else setInternalOpen(val);
  };

  const { currentOrganization } = useOrganization();

  // Derive editing id from current initialData to ensure it updates when selection changes
  const editingId: string | undefined = (initialData as any)?.id;

  const initialIncomeType: IncomeType = (initialData as any)?.income_type || 'general_income';

  // Default field visibility based on income type
  const defaultsByType: Partial<Record<IncomeType, Partial<Record<IncomeFieldKey, boolean>>>> = {
    contribution: {
      envelope_number: true,
      attendance_occasion_id: true,
      attendance_session_id: true,
    },
    donation: {
      envelope_number: true,
      attendance_occasion_id: true,
      attendance_session_id: true,
    },
    general_income: {
      envelope_number: false,
      attendance_occasion_id: true,
      attendance_session_id: true,
    },
    pledge_payment: {
      envelope_number: false,
      attendance_occasion_id: false,
      attendance_session_id: false,
    },
  };

  const computeVisibility = (incomeType: IncomeType): Record<IncomeFieldKey, boolean> => {
    const base: Record<IncomeFieldKey, boolean> = {
      envelope_number: true,
      receipt_number: true,
      occasion_name: true,
      attendance_occasion_id: true,
      attendance_session_id: true,
      description: true,
      notes: true,
      source_type: true,
      member_id: true,
      group_id: true,
      tag_item_id: true,
      source: true,
    };
    const defaults = defaultsByType[incomeType] || {};
    const merged = { ...base, ...defaults };
    return fieldVisibility ? { ...merged, ...fieldVisibility } : merged;
  };

  const [form, setForm] = useState<CreateIncomeInput>(() => ({
    amount: (initialData as any)?.amount ?? 0,
    category: (initialData as any)?.category ?? extendedIncomeTypes[0],
    payment_method: (initialData as any)?.payment_method ?? 'cash',
    date: (initialData as any)?.date ?? new Date().toISOString(),
    description: (initialData as any)?.description ?? '',
    notes: (initialData as any)?.notes ?? '',
    occasion_name: (initialData as any)?.occasion_name ?? '',
    attendance_occasion_id: (initialData as any)?.attendance_occasion_id,
    attendance_session_id: (initialData as any)?.attendance_session_id,
    source: (initialData as any)?.source ?? '',
    source_type: (initialData as any)?.source_type ?? 'member',
    member_id: (initialData as any)?.member_id,
    group_id: (initialData as any)?.group_id,
    tag_item_id: (initialData as any)?.tag_item_id,
    receipt_number: (initialData as any)?.receipt_number ?? undefined,
    branch_id: (initialData as any)?.branch_id ?? null,
    income_type: initialIncomeType,
    envelope_number: (initialData as any)?.envelope_number ?? '',
    tax_deductible: (initialData as any)?.tax_deductible ?? undefined,
    receipt_issued: (initialData as any)?.receipt_issued ?? undefined,
  }));

  // Local selectors for editable fields
  const [memberValue, setMemberValue] = useState<any[]>([]);
  const [occasionValue, setOccasionValue] = useState<OccasionSearchResult[]>(
    form.attendance_occasion_id ? [{ id: form.attendance_occasion_id } as any] : []
  );
  const [sessionValue, setSessionValue] = useState<SessionSearchResult[]>(
    form.attendance_session_id ? [{ id: form.attendance_session_id } as any] : []
  );

  // Queries for read-only display labels
  const memberQuery = useMember(form.member_id);
  const groupQuery = useGroup(form.group_id ?? null);
  const tagsQuery = useTagsQuery(currentOrganization?.id);
  const occasionDetailsQuery = useOccasionDetails(
    form.attendance_occasion_id ? [form.attendance_occasion_id] : []
  );
  const sessionDetailsQuery = useSessionDetails(
    form.attendance_session_id ? [form.attendance_session_id] : []
  );

 

  const visibility = useMemo(() => computeVisibility(form.income_type as IncomeType), [form.income_type, fieldVisibility]);

  // Sync form state with incoming initialData when dialog opens or when selection changes
  useEffect(() => {
    if (!computedOpen) return;

    const data = initialData as any;
    if (data) {
      setForm((prev) => ({
        ...prev,
        amount: data?.amount ?? 0,
        category: data?.category ?? extendedIncomeTypes[0],
        payment_method: data?.payment_method ?? 'cash',
        date: data?.date ?? new Date().toISOString(),
        description: data?.description ?? '',
        notes: data?.notes ?? '',
        occasion_name: data?.occasion_name ?? '',
        attendance_occasion_id: data?.attendance_occasion_id,
        attendance_session_id: data?.attendance_session_id,
        source: data?.source ?? '',
        source_type: data?.source_type ?? 'member',
        member_id: data?.member_id,
        group_id: data?.group_id,
        tag_item_id: data?.tag_item_id,
        receipt_number: data?.receipt_number ?? undefined,
        branch_id: data?.branch_id ?? null,
        income_type: data?.income_type || 'general_income',
        envelope_number: data?.envelope_number ?? '',
        tax_deductible: data?.tax_deductible ?? undefined,
        receipt_issued: data?.receipt_issued ?? undefined,
      }));

      // Pre-populate selector values for typeaheads/selectors
      setMemberValue(data?.member_id ? [{ id: data.member_id } as any] : []);
      setOccasionValue(data?.attendance_occasion_id ? [{ id: data.attendance_occasion_id } as any] : []);
      setSessionValue(data?.attendance_session_id ? [{ id: data.attendance_session_id } as any] : []);
    } else if (mode === 'add') {
      // For add mode without provided defaults, reset to baseline
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedOpen, mode, initialData]);

  // Income type options
  const allIncomeTypeOptions: { value: IncomeType; label: string }[] = [
    { value: 'contribution', label: 'Contribution' },
    { value: 'donation', label: 'Donation' },
    { value: 'general_income', label: 'General Income' },
    { value: 'pledge_payment', label: 'Pledge Payment' },
  ];

  const allowedIncomeTypeOptions = useMemo(() => {
    if (!allowedIncomeTypes || allowedIncomeTypes.length === 0) return allIncomeTypeOptions;
    const allowedSet = new Set<IncomeType>(allowedIncomeTypes);
    return allIncomeTypeOptions.filter((opt) => allowedSet.has(opt.value));
  }, [allowedIncomeTypes]);

  // Ensure current selection is valid if options are restricted
  useEffect(() => {
    const current = form.income_type as IncomeType;
    const isAllowed = allowedIncomeTypeOptions.some((opt) => opt.value === current);
    if (!isAllowed) {
      const fallback = allowedIncomeTypeOptions[0]?.value ?? 'general_income';
      setForm((prev) => ({ ...prev, income_type: fallback }));
      clearError('income_type');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedIncomeTypeOptions]);

  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const isSubmitting = createIncome.isPending || updateIncome.isPending;

  // Validation state and helpers
  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (key: string) =>
    setErrors((prev) => {
      const { [key]: _omit, ...rest } = prev;
      return rest;
    });

  const resetForm = () => {
    setForm((prev) => ({
      ...prev,
      amount: 0,
      category: extendedIncomeTypes[0],
      payment_method: 'cash',
      date: new Date().toISOString(),
      description: '',
      notes: '',
      occasion_name: '',
      attendance_occasion_id: undefined,
      attendance_session_id: undefined,
      source: '',
      source_type: 'member',
      member_id: undefined,
      group_id: undefined,
      tag_item_id: undefined,
      receipt_number: undefined,
      envelope_number: '',
      tax_deductible: undefined,
      receipt_issued: undefined,
    }));
    setMemberValue([]);
    setOccasionValue([]);
    setSessionValue([]);
    setErrors({});
  };

  const validateForm = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};

    // Amount
    if (!form.amount || form.amount <= 0) {
      nextErrors.amount = 'Amount must be greater than zero.';
    }

    // Income Type & Category
    if (!form.income_type) {
      nextErrors.income_type = 'Please select an income type.';
    }
    if (!form.category) {
      nextErrors.category = 'Please select a category.';
    }

    // Source Type and related selection
    if (visibility.source_type && !form.source_type) {
      nextErrors.source_type = 'Please select a source type.';
    }
    if (form.source_type === 'member' && visibility.member_id && !form.member_id) {
      nextErrors.member_id = 'Please select a member as the source.';
    }
    if (form.source_type === 'group' && visibility.group_id && !form.group_id) {
      nextErrors.group_id = 'Please select a group as the source.';
    }
    if (form.source_type === 'tag_item' && visibility.tag_item_id && !form.tag_item_id) {
      nextErrors.tag_item_id = 'Please select a tag item as the source.';
    }
    if (form.source_type === 'other' && visibility.source && !(form.source || '').trim()) {
      nextErrors.source = 'Please provide a name for the source.';
    }

    // Payment method
    if (!form.payment_method) {
      nextErrors.payment_method = 'Please select a payment method.';
    }

    // Date
    if (!form.date) {
      nextErrors.date = 'Please provide a date.';
    } else {
      const d = new Date(form.date);
      if (Number.isNaN(d.getTime())) {
        nextErrors.date = 'Please provide a valid date/time.';
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // Guard: ensure receipt_number is unique per organization
    const receipt = (form.receipt_number || '').trim();
    if (receipt && currentOrganization?.id) {
      try {
        let query = supabase
          .from('income')
          .select('id', { count: 'exact' })
          .eq('organization_id', currentOrganization.id)
          .eq('is_deleted', false)
          .eq('receipt_number', receipt);
        if (mode === 'edit' && editingId) {
          query = query.neq('id', editingId);
        }
        const { error, count } = await query;
        if (error) {
          setErrors((prev) => ({ ...prev, receipt_number: 'Could not verify receipt number uniqueness.' }));
          return;
        }
        if ((count || 0) > 0) {
          setErrors((prev) => ({ ...prev, receipt_number: 'Receipt number already exists in this organization.' }));
          return;
        }
      } catch (err) {
        setErrors((prev) => ({ ...prev, receipt_number: 'Could not verify receipt number uniqueness.' }));
        return;
      }
    }
    try {
      if (mode === 'edit' && editingId) {
        const updated = await updateIncome.mutateAsync({ id: editingId, updates: { ...form } });
        onSuccess?.(updated as any);
      } else {
        const created = await createIncome.mutateAsync({ ...form });
        onSuccess?.(created as any);
      }
      resetForm();
      setOpen(false);
    } catch (err) {
      // Mutation hooks show toasts; no-op here
    }
  };

  return (
    <Dialog open={computedOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{title || (isAdd ? 'Add Income' : 'Edit Income')}</DialogTitle>
          <DialogDescription>
            {isAdd
              ? 'Record a new income across contributions, donations, pledges, or general.'
              : 'Update income details and sources.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount & Types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                onBlur={() => clearError('amount')}
                aria-invalid={!!errors.amount}
                required
              />
              {errors.amount && (
                <p className="text-destructive text-sm mt-1" aria-live="polite">{errors.amount}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label>Income Type *</Label>
              <Select
                value={form.income_type as IncomeType}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, income_type: value as IncomeType }))
                }
              >
                <SelectTrigger className="w-full" aria-invalid={!!errors.income_type}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedIncomeTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.income_type && (
                <p className="text-destructive text-sm mt-1" aria-live="polite">{errors.income_type}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    category: value as any,
                  }))
                }
              >
                <SelectTrigger className="w-full" aria-invalid={!!errors.category}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {extendedIncomeTypes.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-destructive text-sm mt-1" aria-live="polite">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Source Section */}
          {visibility.source_type && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Source Type *</Label>
                <Select
                  value={form.source_type as any}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      source_type: value as any,
                      member_id: undefined,
                      group_id: undefined,
                      tag_item_id: undefined,
                      source: '',
                    }))
                  }
                >
                  <SelectTrigger className="w-full" aria-invalid={!!errors.source_type}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="tag_item">Tag Item</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="church">Church</SelectItem>
                  </SelectContent>
                </Select>
                {errors.source_type && (
                  <p className="text-destructive text-sm mt-1" aria-live="polite">{errors.source_type}</p>
                )}
              </div>

              <div className="md:col-span-2">
                {form.source_type === 'member' && visibility.member_id && (
                  <>
                  <EditableField
                    label="Select Member *"
                    startInEdit={isAdd && !form.member_id}
                    defaultShowCloseButton={!isAdd}
                    value={
                      memberValue?.[0]?.display_name ||
                      (memberQuery.data
                        ? (memberQuery.data as any).full_name ||
                          `${(memberQuery.data as any).first_name ?? ''} ${
                            (memberQuery.data as any).middle_name ?? ''
                          } ${(memberQuery.data as any).last_name ?? ''}`.trim()
                        : 'Not selected')
                    }
                    renderEditor={() => (
                      <MemberSearchTypeahead
                        organizationId={currentOrganization?.id || ''}
                        value={memberValue}
                        onChange={(members) => {
                          setMemberValue(members);
                          const first = (members as any[])[0];
                          setForm((prev) => ({ ...prev, member_id: first?.id }));
                          clearError('member_id');
                        }}
                        multiSelect={false}
                      />
                    )}
                  />
                  {errors.member_id && (
                    <p className="text-destructive text-sm mt-1" aria-live="polite">{errors.member_id}</p>
                  )}
                  </>
                )}
                {form.source_type === 'group' && visibility.group_id && (
                  <>
                  <EditableField
                    label="Select Group *"
                    startInEdit={isAdd && !form.group_id}
                    defaultShowCloseButton={!isAdd}
                    value={groupQuery.data?.name || 'Not selected'}
                    renderEditor={() => (
                      <GroupSelect
                        value={form.group_id}
                        onChange={(id) => setForm((prev) => ({ ...prev, group_id: id }))}
                      />
                    )}
                  />
                  {errors.group_id && (
                    <p className="text-destructive text-sm mt-1" aria-live="polite">{errors.group_id}</p>
                  )}
                  </>
                )}
                {form.source_type === 'tag_item' && visibility.tag_item_id && (
                  <>
                  <EditableField
                    label="Select Tag Item *"
                    startInEdit={isAdd && !form.tag_item_id}
                    defaultShowCloseButton={!isAdd}
                    value={(() => {
                      const items = (tagsQuery.data || []).flatMap((t) => t.tag_items || []);
                      const found = items.find((it) => it.id === form.tag_item_id);
                      return found?.name || 'Not selected';
                    })()}
                    renderEditor={() => (
                      <TagItemSelect
                        value={form.tag_item_id}
                        onChange={(id) => setForm((prev) => ({ ...prev, tag_item_id: id }))}
                      />
                    )}
                  />
                  {errors.tag_item_id && (
                    <p className="text-destructive text-sm mt-1" aria-live="polite">{errors.tag_item_id}</p>
                  )}
                  </>
                )}
                {form.source_type === 'other' && visibility.source && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sourceName">Name *</Label>
                      <Input
                        id="sourceName"
                        value={form.source || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, source: e.target.value }))}
                        placeholder="Enter name"
                        onBlur={() => clearError('source')}
                        aria-invalid={!!errors.source}
                      />
                      {errors.source && (
                        <p className="text-destructive text-sm mt-1" aria-live="polite">{errors.source}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Occasion & Session */}
          {(visibility.attendance_occasion_id || visibility.attendance_session_id) && (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <EditableField
                  label=""
                  startInEdit={isAdd && !(form.attendance_occasion_id || form.attendance_session_id)}
                  defaultShowCloseButton={!isAdd}
                  value={
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                      <div>
                        <span className="text-xs text-muted-foreground">Occasion</span>
                        <div className="text-sm font-medium">
                          {occasionValue?.[0]?.display_name ||
                            occasionDetailsQuery.data?.[0]?.display_name ||
                            'Not selected'}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Session</span>
                        <div className="text-sm font-medium">
                          {sessionValue?.[0]?.display_name ||
                            sessionDetailsQuery.data?.[0]?.display_name ||
                            'Not selected'}
                        </div>
                      </div>
                    </div>
                  }
                  renderEditor={() => (
                    <OccasionSessionSelector
                      occasionValue={occasionValue}
                      onOccasionChange={(occasions) => {
                        setOccasionValue(occasions);
                        const first = (occasions as any[])[0];
                        setForm((prev) => ({ ...prev, attendance_occasion_id: first?.id }));
                      }}
                      sessionValue={sessionValue}
                      onSessionChange={(sessions) => {
                        setSessionValue(sessions);
                        const first = (sessions as any[])[0];
                        setForm((prev) => ({ ...prev, attendance_session_id: first?.id }));
                      }}
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select
              value={form.payment_method}
              onValueChange={(value: any) => setForm((prev) => ({ ...prev, payment_method: value }))}
            >
              <SelectTrigger className="w-full" aria-invalid={!!errors.payment_method}>
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
              <p className="text-destructive text-sm mt-1" aria-live="polite">{errors.payment_method}</p>
            )}
          </div>

          {/* Branch (optional) */}
          <div className="space-y-2">
            <Label>Branch (optional)</Label>
            <BranchSelector
              variant="single"
              value={form.branch_id || undefined}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, branch_id: (v as string | undefined) ?? null }))
              }
              allowClear
              placeholder="All branches (joint record)"
            />
          </div>

          {/* Date & Envelope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <DateTimePicker
                value={form.date}
                onChange={(dateTime) => setForm((prev) => ({ ...prev, date: dateTime }))}
                dateLabel="Date *"
                timeLabel="Time"
                align="start"
                id="income-date"
              />
              {errors.date && (
                <p className="text-destructive text-sm mt-1" aria-live="polite">{errors.date}</p>
              )}
            </div>
            {visibility.envelope_number && (
              <div className="space-y-2">
                <Label htmlFor="envelopeNumber">Envelope Number (optional)</Label>
                <Input
                  id="envelopeNumber"
                  value={form.envelope_number || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, envelope_number: e.target.value }))}
                  placeholder="Enter envelope number"
                />
              </div>
            )}
          </div>

          {/* Description & Notes */}
          {visibility.description && (
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
              />
            </div>
          )}
          {visibility.notes && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isAdd ? 'Adding' : 'Updating') : isAdd ? 'Add Income' : 'Update Income'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
