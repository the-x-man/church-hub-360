import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/shared/DatePicker';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { GroupSelect } from '@/components/finance/GroupSelect';
import { TagItemSelect } from '@/components/finance/TagItemSelect';
import { EditableField } from '@/components/shared/EditableField';
import { usePledgePreferences } from '@/hooks/finance/usePledgePreferences';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCreatePledge, useUpdatePledge, type CreatePledgeInput } from '@/hooks/finance/pledges';
import { PledgeOptionsSelect } from '@/components/finance/pledges/PledgeOptionsSelect';
import { useMember } from '@/hooks/useMemberQueries';
import { useGroup } from '@/hooks/useGroups';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import { format } from 'date-fns';

interface PledgeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  title?: string;
  initialData?: Partial<CreatePledgeInput> & { id?: string; description?: string };
  onSuccess?: () => void;
}

export function PledgeFormDialog({ open, onOpenChange, mode, title, initialData, onSuccess }: PledgeFormDialogProps) {
  const { currentOrganization } = useOrganization();
  const createPledge = useCreatePledge();
  const updatePledge = useUpdatePledge();
  const { typeOptions, frequencyOptions, addType, addFrequency } = usePledgePreferences();
  const isAdd = mode === 'add';

  const [memberSelection, setMemberSelection] = useState<{ id: string; display_name: string; display_subtitle: string }[]>([]);
  const [memberId, setMemberId] = useState<string>('');
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const [tagItemId, setTagItemId] = useState<string | undefined>(undefined);
  const [sourceName, setSourceName] = useState<string>('');
  const [sourceType, setSourceType] = useState<'member' | 'group' | 'tag_item' | 'other' | 'church'>('member');
  const [pledgeAmount, setPledgeAmount] = useState<number>(0);
  const [pledgeTypeLabel, setPledgeTypeLabel] = useState<string>('annual_pledge');
  const [campaignName, setCampaignName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentFrequencyLabel, setPaymentFrequencyLabel] = useState<string>('monthly');
  const [description, setDescription] = useState<string>('');

  // Queries for display labels when not editing
  const memberQuery = useMember(memberId);
  const groupQuery = useGroup(groupId ?? null);
  const tagsQuery = useTagsQuery(currentOrganization?.id);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setSourceType((initialData.source_type as any) || 'member');
      setSourceName(initialData.source || '');
      setMemberId(initialData.member_id || '');
      setGroupId(initialData.group_id);
      setTagItemId(initialData.tag_item_id);
      setPledgeAmount(initialData.pledge_amount || 0);
      setPledgeTypeLabel((initialData as any).pledge_type_label || initialData.pledge_type || '');
      setCampaignName(initialData.campaign_name || '');
      setStartDate(initialData.start_date || '');
      setEndDate(initialData.end_date || '');
      setPaymentFrequencyLabel((initialData as any).payment_frequency_label || initialData.payment_frequency || '');
      setDescription(initialData.description || '');
      if (initialData.member_id) {
        setMemberSelection([{ id: initialData.member_id, display_name: '', display_subtitle: '' }]);
      } else {
        setMemberSelection([]);
      }
    } else {
      setMemberSelection([]);
      setMemberId('');
      setGroupId(undefined);
      setTagItemId(undefined);
      setSourceName('');
      setSourceType('member');
      setPledgeAmount(0);
      setPledgeTypeLabel('Annual Pledge');
      setCampaignName('');
      const today = new Date();
      const start = format(new Date(), 'yyyy-MM-dd');
      const end = format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd');
      setStartDate(start);
      setEndDate(end);
      setPaymentFrequencyLabel('Monthly');
      setDescription('');
    }
  }, [open, initialData]);

  const isSubmitting = createPledge.isPending || updatePledge.isPending;

  const pledgeTypeOptions = useMemo(() => (typeOptions || []), [typeOptions]);
  const frequencyOpts = useMemo(() => (frequencyOptions || []), [frequencyOptions]);

  const canSubmit = (() => {
    if (!(pledgeAmount > 0 && startDate && endDate)) return false;
    switch (sourceType) {
      case 'member':
        return !!memberId;
      case 'group':
        return !!groupId;
      case 'tag_item':
        return !!tagItemId;
      case 'other':
        return !!sourceName.trim();
      case 'church':
        return true;
      default:
        return false;
    }
  })();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    const finalPledgeType: string = pledgeTypeLabel || 'Other';
    const finalPaymentFrequency: string = paymentFrequencyLabel || 'One time';
    const finalDescription = description || '';

    const sourceFields = {
      source_type: sourceType,
      source: sourceType === 'other' ? sourceName : undefined,
      member_id: sourceType === 'member' ? memberId : undefined,
      group_id: sourceType === 'group' ? groupId : undefined,
      tag_item_id: sourceType === 'tag_item' ? tagItemId : undefined,
    } as Partial<CreatePledgeInput>;

    if (mode === 'add') {
      const payload: CreatePledgeInput = {
        ...sourceFields,
        pledge_amount: pledgeAmount,
        pledge_type: finalPledgeType,
        campaign_name: campaignName || undefined,
        start_date: startDate,
        end_date: endDate,
        payment_frequency: finalPaymentFrequency,
        description: finalDescription || undefined,
        branch_id: null,
      } as CreatePledgeInput;
      await createPledge.mutateAsync(payload);
    } else if (mode === 'edit' && initialData?.id) {
      await updatePledge.mutateAsync({ id: initialData.id, updates: {
        ...sourceFields,
        pledge_amount: pledgeAmount,
        pledge_type: finalPledgeType,
        campaign_name: campaignName || undefined,
        start_date: startDate,
        end_date: endDate,
        payment_frequency: finalPaymentFrequency,
        description: finalDescription || undefined,
      }});
    }
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title || (mode === 'add' ? 'Add New Pledge' : 'Edit Pledge')}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Create a new pledge commitment for a member.' : 'Update pledge information.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pledge_amount">Pledge Amount</Label>
            <Input
              id="pledge_amount"
              type="number"
              value={pledgeAmount}
              onChange={(e) => setPledgeAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Source Type</Label>
            <Select value={sourceType} onValueChange={(v) => {
              const sv = v as typeof sourceType;
              setSourceType(sv);
              // reset selections on type change
              setMemberId('');
              setMemberSelection([]);
              setGroupId(undefined);
              setTagItemId(undefined);
              setSourceName('');
            }}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='member'>Member</SelectItem>
                <SelectItem value='group'>Group</SelectItem>
                <SelectItem value='tag_item'>Tag Item</SelectItem>
                <SelectItem value='other'>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sourceType === 'member' && (
            <div className="md:col-span-2">
              <EditableField
                label="Select Member *"
                startInEdit={isAdd && !memberId}
                defaultShowCloseButton={!isAdd}
                value={
                  memberSelection?.[0]?.display_name ||
                  (memberQuery.data
                    ? ((memberQuery.data as any).full_name || `${(memberQuery.data as any).first_name ?? ''} ${((memberQuery.data as any).middle_name ?? '')} ${(memberQuery.data as any).last_name ?? ''}`.trim())
                    : 'Not selected')
                }
                renderEditor={() => (
                  currentOrganization ? (
                    <MemberSearchTypeahead
                      organizationId={currentOrganization.id}
                      value={memberSelection as any}
                      onChange={(arr) => {
                        setMemberSelection(arr as any);
                        setMemberId((arr as any)[0]?.id || '');
                      }}
                      placeholder="Search member by name, email or phone"
                      multiSelect={false}
                    />
                  ) : null
                )}
              />
            </div>
          )}

          {sourceType === 'group' && (
            <div className="md:col-span-2">
              <EditableField
                label="Select Group *"
                startInEdit={isAdd && !groupId}
                defaultShowCloseButton={!isAdd}
                value={groupQuery.data?.name || 'Not selected'}
                renderEditor={() => (
                  <GroupSelect
                    label="Group"
                    value={groupId}
                    onChange={setGroupId}
                    placeholder="Search groups by name"
                  />
                )}
              />
            </div>
          )}

          {sourceType === 'tag_item' && (
            <div className="md:col-span-2">
              <EditableField
                label="Select Tag Item *"
                startInEdit={isAdd && !tagItemId}
                defaultShowCloseButton={!isAdd}
                value={(() => {
                  const items = (tagsQuery.data || []).flatMap((t: any) => t.tag_items || []);
                  const selected = items.find((i: any) => i.id === tagItemId);
                  return selected?.name || 'Not selected';
                })()}
                renderEditor={() => (
                  <TagItemSelect
                    label="Tag Item"
                    value={tagItemId}
                    onChange={setTagItemId}
                    placeholder="Search tags and items"
                  />
                )}
              />
            </div>
          )}

          {sourceType === 'other' && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="source_name">Source Name</Label>
              <Input id="source_name" value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="e.g., Anonymous Donor" />
            </div>
          )}

         

          <div className="space-y-2">
            <PledgeOptionsSelect
              label="Pledge Type"
              value={pledgeTypeLabel || null}
              options={pledgeTypeOptions}
              onChange={setPledgeTypeLabel}
              onCreateOption={async (label) => {
                await addType(label);
              }}
            />
          </div>

          <div className="space-y-2">
            <PledgeOptionsSelect
              label="Payment Frequency"
              value={paymentFrequencyLabel || null}
              options={frequencyOpts}
              onChange={setPaymentFrequencyLabel}
              onCreateOption={async (label) => {
                await addFrequency(label);
              }}
            />
          </div>

          <div className="space-y-2">
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              buttonId="start-date"
              formatDateLabel={(d) => format(d, 'MMM dd, yyyy')}
            />
          </div>

          <div className="space-y-2">
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              buttonId="end-date"
              formatDateLabel={(d) => format(d, 'MMM dd, yyyy')}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="campaign_name">Campaign</Label>
            <Input id="campaign_name" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g., Building Fund 2024" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details about the pledge..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {mode === 'add' ? 'Add Pledge' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}