import { type GroupAssignment } from '@/components/people/groups/GroupsRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAttendanceOccasions } from '@/hooks/attendance/useAttendanceOccasions';
import { useBulkCreateAttendanceSessions, useCreateAttendanceSession } from '@/hooks/attendance/useAttendanceSessions';
import { useGroups, type Group } from '@/hooks/useGroups';
import type { MemberSearchResult } from '@/hooks/useMemberSearch';
import type { RelationalTagWithItems } from '@/hooks/useRelationalTags';
import { useRelationalTags } from '@/hooks/useRelationalTags';
import { attendanceSessionSchema } from '@/schemas/attendanceSessionSchema';
import type { AttendanceMarkingModes, AttendanceOccasionWithRelations, CreateAttendanceSessionInput } from '@/types/attendance';
import type { DraftSession } from '@/types/attendanceWizard';
import { doesDateMatch, generateNextOccurrences, generateOccurrences, getRangeForOption, type BulkDurationOption } from '@/utils/recurrence';
import { format } from 'date-fns';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DateSelectionStep } from './wizard/DateSelectionStep';
import { GeneratedSessionsList } from './wizard/GeneratedSessionsList';
import { GlobalSettingsStep } from './wizard/GlobalSettingsStep';
import { OccasionModeStep } from './wizard/OccasionModeStep';
import { ConflictErrorAlert, type ConflictErrorInfo } from './wizard/ConflictErrorAlert';

interface SessionCreationWizardProps {
  onCancel: () => void;
}


export function SessionCreationWizard({ onCancel }: SessionCreationWizardProps) {
  const { currentOrganization } = useOrganization();
  const { data: occasions = [], isLoading: occasionsLoading } = useAttendanceOccasions({ is_active: true });
  const { tags = [] } = useRelationalTags();
  const { data: groupsResponse } = useGroups();
  const groups = (groupsResponse?.data ?? []) as Group[];

  const createSession = useCreateAttendanceSession();
  const bulkCreateSessions = useBulkCreateAttendanceSessions();

  const [selectedOccasionId, setSelectedOccasionId] = useState<string>('');
  const selectedOccasion = useMemo<AttendanceOccasionWithRelations | undefined>(
    () => occasions.find(o => o.id === selectedOccasionId),
    [occasions, selectedOccasionId]
  );
  const isRecurring = Boolean(selectedOccasion?.recurrence_rule);

  // Single vs Bulk mode
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // Single date selection
  const [singleDate, setSingleDate] = useState<string>('');

  // Auto-set next recurring date when in single mode for recurring occasions
  // and prevent manual editing in the date picker.
  useEffect(() => {
    if (mode === 'single' && isRecurring && selectedOccasion?.recurrence_rule) {
      try {
        const next = generateNextOccurrences(selectedOccasion.recurrence_rule, 1, new Date())[0];
        const nextDateOnly = next ? next.toISOString().split('T')[0] : '';
        if (nextDateOnly && singleDate !== nextDateOnly) {
          setSingleDate(nextDateOnly);
        }
      } catch (e) {
        // Fallback: keep existing singleDate if computation fails
      }
    }
  }, [mode, isRecurring, selectedOccasion?.recurrence_rule]);

  // Bulk range selection
  const [bulkOption, setBulkOption] = useState<BulkDurationOption>('next_1_session');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  // Bulk manual dates for non-recurring occasions
  const [manualDateInput, setManualDateInput] = useState<string>('');
  const [manualDates, setManualDates] = useState<string[]>([]);

  // Global settings
  const [baseName, setBaseName] = useState<string>('');
  const [globalStart, setGlobalStart] = useState<string>(new Date().toISOString());
  const [globalEnd, setGlobalEnd] = useState<string>(new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString());
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [allowPublicMarking, setAllowPublicMarking] = useState<boolean>(false);
  const [proximityRequired, setProximityRequired] = useState<boolean>(false);
  const [location, setLocation] = useState<{ lat?: number; lng?: number; radius?: number }>({});
  const getValidLocation = () => {
    if (!proximityRequired) return undefined;
    if (typeof location.lat === 'number' && typeof location.lng === 'number') {
      return { lat: location.lat, lng: location.lng, radius: location.radius };
    }
    return undefined;
  };
  const [markingModes, setMarkingModes] = useState<AttendanceMarkingModes>({
    email: true, phone: true, membership_id: true, manual: true,
  });
  // Store allowed tags per tag category to avoid clearing selections
  const [allowedTagsByTag, setAllowedTagsByTag] = useState<Record<string, string | string[]>>({});
  const [allowedGroups, setAllowedGroups] = useState<GroupAssignment[]>([]);
  const [allowedMembers, setAllowedMembers] = useState<MemberSearchResult[]>([]);

  // Draft sessions
  const [drafts, setDrafts] = useState<DraftSession[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [conflictError, setConflictError] = useState<ConflictErrorInfo | null>(null);

  const parseConflictError = (message: string): ConflictErrorInfo | null => {
    if (!message) return null;
    const singlePrefix = 'Conflicting session exists on the same date/time:';
    const bulkPrefix = 'Conflicting sessions detected on the same date/time:';
    const trimmed = message.trim();
    if (trimmed.startsWith(singlePrefix)) {
      const details = trimmed.slice(singlePrefix.length).trim();
      const items = details.split(', ').map((s) => s.trim()).filter(Boolean);
      return { mode: 'single', items };
    }
    if (trimmed.startsWith(bulkPrefix)) {
      const details = trimmed.slice(bulkPrefix.length).trim();
      const items = details.split(' | ').map((s) => s.trim()).filter(Boolean);
      return { mode: 'bulk', items };
    }
    return null;
  };

  // Friendly date formatter: Mon, 10 Nov 2025
  const formatFriendlyDate = (date: Date) =>
    new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);

  const computeNameForDate = (date: Date) => {
    const dateLabel = format(date, 'PPP');
    const occasionName = selectedOccasion?.name || '';
    const parts = [occasionName, dateLabel].filter(Boolean);
    const custom = baseName?.trim();
    return custom ? `${custom} – ${dateLabel}` : parts.join(' – ');
  };

  const applyGlobalToDraft = (base: Omit<CreateAttendanceSessionInput, 'organization_id'>, date: Date): DraftSession => {
    const start = new Date(globalStart);
    const end = new Date(globalEnd);

    // Align time to the date occurrence
    const startAligned = new Date(date);
    startAligned.setHours(start.getHours(), start.getMinutes(), 0, 0);
    const endAligned = new Date(date);
    endAligned.setHours(end.getHours(), end.getMinutes(), 0, 0);

    return {
      id: Math.random().toString(36).slice(2),
      ...base,
      name: computeNameForDate(date),
      start_time: startAligned.toISOString(),
      end_time: endAligned.toISOString(),
      is_open: isOpen,
      allow_public_marking: allowPublicMarking,
      proximity_required: proximityRequired,
      location: getValidLocation(),
      allowed_tags: flattenAllowedTags(),
      allowed_groups: allowedGroups.length ? allowedGroups.map(g => g.groupId) : undefined,
      allowed_members: allowedMembers.length ? allowedMembers.map(m => m.id) : undefined,
      marking_modes: { ...markingModes },
    };
  };

  const flattenAllowedTags = (): string[] | undefined => {
    const ids = Object.values(allowedTagsByTag)
      .flatMap((v) => Array.isArray(v) ? v : (v ? [v] : []))
      .filter(Boolean) as string[];
    return ids.length ? ids : undefined;
  };

  const handleGenerateDrafts = () => {
    setValidationErrors([]);
    setConflictError(null);
    if (!selectedOccasionId) {
      setValidationErrors(['Please select an occasion.']);
      return;
    }

    const base: Omit<CreateAttendanceSessionInput, 'organization_id'> = {
      occasion_id: selectedOccasionId,
      name: '',
      start_time: globalStart,
      end_time: globalEnd,
      is_open: isOpen,
      allow_public_marking: allowPublicMarking,
      proximity_required: proximityRequired,
      location: getValidLocation(),
      allowed_tags: flattenAllowedTags(),
      allowed_groups: allowedGroups.length ? allowedGroups.map(g => g.groupId) : undefined,
      allowed_members: allowedMembers.length ? allowedMembers.map(m => m.id) : undefined,
      marking_modes: { ...markingModes },
    };

    if (mode === 'single') {
      if (!singleDate) {
        setValidationErrors(['Please select a date.']);
        return;
      }
      const dateObj = new Date(singleDate);
      if (isRecurring && selectedOccasion?.recurrence_rule && !doesDateMatch(selectedOccasion.recurrence_rule, dateObj)) {
        setValidationErrors(['Selected date does not match the occasion recurrence pattern.']);
        return;
      }

      const draft = applyGlobalToDraft(base, dateObj);
      setDrafts([draft]);
      return;
    }

    // Bulk mode
    // If occasion is non-recurring, use manually added dates
    const rule = selectedOccasion?.recurrence_rule;
    if (!isRecurring || !rule) {
      if (manualDates.length === 0) {
        setValidationErrors(['Add at least one date for bulk creation.']);
        return;
      }
      const dates = manualDates
        .map((d) => new Date(d))
        .filter((d) => !isNaN(d.getTime()));
      if (dates.length === 0) {
        setValidationErrors(['No valid dates selected.']);
        return;
      }
      const newDrafts = dates.map((d) => applyGlobalToDraft(base, d));
      setDrafts(newDrafts);
      return;
    }

    // Recurring bulk: sessions presets and month ranges
    let occurrences: Date[] = [];
    const sessionPresetMap: Record<BulkDurationOption, number> = {
      next_1_session: 1,
      next_2_sessions: 2,
      next_3_sessions: 3,
      next_4_sessions: 4,
      next_5_sessions: 5,
      next_6_sessions: 6,
      next_7_sessions: 7,
      next_8_sessions: 8,
      current_month: 0,
      next_2_months: 0,
      next_3_months: 0,
      next_4_months: 0,
      next_5_months: 0,
      next_6_months: 0,
      custom_range: 0,
    };

    const sessionCount = sessionPresetMap[bulkOption] ?? 0;
    if (sessionCount > 0) {
      occurrences = generateNextOccurrences(rule, sessionCount, new Date());
    } else if (bulkOption === 'custom_range') {
      if (!customStartDate || !customEndDate) {
        setValidationErrors(['Please select a custom start and end date.']);
        return;
      }
      const rangeStart = new Date(customStartDate);
      const rangeEnd = new Date(customEndDate);
      occurrences = generateOccurrences(rule, rangeStart, rangeEnd);
    } else {
      const { start, end } = getRangeForOption(bulkOption);
      occurrences = generateOccurrences(rule, start, end);
    }
    if (occurrences.length === 0) {
      setValidationErrors(['No matching dates found for the selected range.']);
      return;
    }

    const newDrafts = occurrences.map((d) => applyGlobalToDraft(base, d));
    setDrafts(newDrafts);
  };

  const handleUpdateDraft = (id: string, updates: Partial<DraftSession>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const handleRemoveDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const validateDrafts = (): string[] => {
    const errors: string[] = [];
    drafts.forEach((d, idx) => {
      const result = attendanceSessionSchema.safeParse({
        name: d.name || '',
        occasion_id: d.occasion_id,
        start_time: d.start_time,
        end_time: d.end_time,
        is_open: d.is_open ?? true,
        allow_public_marking: d.allow_public_marking ?? false,
        proximity_required: d.proximity_required ?? false,
        location: d.location,
        allowed_tags: d.allowed_tags || [],
        allowed_groups: d.allowed_groups || [],
        allowed_members: d.allowed_members || [],
        marking_modes: d.marking_modes as any,
      });
      if (!result.success) {
        const firstIssue = result.error.issues?.[0]?.message || 'Invalid data';
        errors.push(`Session ${idx + 1}: ${firstIssue}`);
      }
    });
    return errors;
  };

  const handleCreate = async () => {
    const errs = validateDrafts();
    setValidationErrors(errs);
    if (errs.length > 0) return;
    setConflictError(null);

    const payload: CreateAttendanceSessionInput[] = drafts.map((d) => ({
      organization_id: currentOrganization?.id || '',
      occasion_id: d.occasion_id,
      name: d.name,
      start_time: d.start_time,
      end_time: d.end_time,
      is_open: d.is_open,
      allow_public_marking: d.allow_public_marking,
      proximity_required: d.proximity_required,
      location: d.location,
      allowed_tags: d.allowed_tags,
      allowed_groups: d.allowed_groups,
      allowed_members: d.allowed_members,
      marking_modes: d.marking_modes,
    }));

    try {
      if (payload.length === 1) {
        await createSession.mutateAsync(payload[0]);
      } else {
        await bulkCreateSessions.mutateAsync(payload);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '';
      const parsed = parseConflictError(message);
      if (parsed) {
        setConflictError(parsed);
        return; // Keep wizard open to let user resolve conflicts
      }
      // Non-conflict errors will be handled by mutation's onError toast
      return;
    }

    onCancel();
  };

  const isSubmitting = createSession.isPending || bulkCreateSessions.isPending;

  return (
    <div className="space-y-6">
      {/* Step 1: Occasion selection */}
      <OccasionModeStep
        occasions={occasions}
        occasionsLoading={occasionsLoading}
        selectedOccasionId={selectedOccasionId}
        onChangeOccasionId={setSelectedOccasionId}
        mode={mode}
        onChangeMode={(v) => setMode(v)}
        isRecurring={isRecurring}
        hasSelection={Boolean(selectedOccasion)}
      />

      {/* Step 2: Date selection */}
      <DateSelectionStep
        mode={mode}
        isRecurring={isRecurring}
        selectedOccasion={selectedOccasion}
        singleDate={singleDate}
        onChangeSingleDate={setSingleDate}
        singleDateDisabled={isRecurring && mode === 'single'}
        bulkOption={bulkOption}
        onChangeBulkOption={(v) => setBulkOption(v)}
        customStartDate={customStartDate}
        onChangeCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        onChangeCustomEndDate={setCustomEndDate}
        manualDateInput={manualDateInput}
        onChangeManualDateInput={setManualDateInput}
        manualDates={manualDates}
        onChangeManualDates={setManualDates}
        validationErrors={validationErrors}
        formatDateLabel={formatFriendlyDate}
      />

      {/* Step 3: Session details (global) */}
      <GlobalSettingsStep
        baseName={baseName}
        onChangeBaseName={setBaseName}
        isOpen={isOpen}
        onChangeIsOpen={setIsOpen}
        globalStartISO={globalStart}
        onChangeGlobalStartISO={setGlobalStart}
        globalEndISO={globalEnd}
        onChangeGlobalEndISO={setGlobalEnd}
        tags={tags as RelationalTagWithItems[]}
        allowedTagsByTag={allowedTagsByTag}
        onChangeAllowedTagForTag={(tagId, v) => setAllowedTagsByTag((prev) => ({ ...prev, [tagId]: v }))}
        groups={groups}
        allowedGroups={allowedGroups}
        onChangeAllowedGroups={setAllowedGroups}
        organizationId={currentOrganization?.id}
        allowedMembers={allowedMembers as any}
        onChangeAllowedMembers={setAllowedMembers as any}
        markingModes={markingModes}
        onChangeMarkingModes={(v) => setMarkingModes(v)}
        allowPublicMarking={allowPublicMarking}
        onChangeAllowPublicMarking={setAllowPublicMarking}
        proximityRequired={proximityRequired}
        onChangeProximityRequired={setProximityRequired}
        location={location}
        onChangeLocation={setLocation}
      />

      <Card className='shadow-none border-none'>
        <CardContent className='flex  items-center justify-between gap-4'>
          <span className="text-sm text-muted-foreground">Generate a preview of the sessions to be created.</span>
          <Button onClick={handleGenerateDrafts} variant="secondary" disabled={isSubmitting} className='border border-secondary-foreground/50'>
            Generate Sessions
          </Button>
        </CardContent>
      </Card>

      {/* Conflict errors */}
      {conflictError && (
        <ConflictErrorAlert
          info={conflictError}
          onDismiss={() => setConflictError(null)}
        />
      )}

      {/* Generated drafts sessions */}
      <GeneratedSessionsList
        drafts={drafts}
        onUpdateDraft={handleUpdateDraft}
        onRemoveDraft={handleRemoveDraft}
        datesReadOnly={isRecurring}
        formatDateLabel={formatFriendlyDate}
      />

      {/* Actions */}
      {drafts.length !== 0 && (
        <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        
        <Button onClick={handleCreate} disabled={drafts.length === 0 || isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating...</span>
          ) : (
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Create Sessions</span>
          )}
        </Button>
      </div>
        )}
    </div>
  );
}