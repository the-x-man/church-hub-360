import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Clock, MapPin, Loader2 } from 'lucide-react';
import { useAttendanceOccasions } from '@/hooks/attendance/useAttendanceOccasions';
import { useRelationalTags } from '@/hooks/useRelationalTags';
import { TagMultiCheckboxRenderer } from '@/components/people/tags/TagMultiCheckboxRenderer';
import { GroupsRenderer, type GroupAssignment } from '@/components/people/groups/GroupsRenderer';
import { useAllGroups } from '@/hooks/useGroups';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { useMemberDetails, type MemberSearchResult } from '@/hooks/useMemberSearch';
import { useOrganization } from '@/contexts/OrganizationContext';
import { DateTimePicker } from '@/components/shared/DateTimePicker';
import { 
  attendanceSessionSchema, 
  defaultSessionFormValues,
  type AttendanceSessionFormData 
} from '@/schemas/attendanceSessionSchema';
import type { AttendanceSession } from '@/types/attendance';
import type { RelationalTagWithItems } from '@/hooks/useRelationalTags';
import { cn } from '@/lib/utils';

interface SessionFormProps {
  mode: 'create' | 'edit';
  initialData?: AttendanceSession;
  onSubmit: (data: AttendanceSessionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SessionForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: SessionFormProps) {
  const { data: occasions = [], isLoading: occasionsLoading } = useAttendanceOccasions({
    is_active: true,
  });
  
  const { tags = [] } = useRelationalTags();
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id;
  const { data: groupsResponse } = useAllGroups();
  const groups = groupsResponse || [];

  // Local UI states for per-tag values, group assignments, and member selections
  const [allowedTagsByTag, setAllowedTagsByTag] = useState<Record<string, string[]>>({});
  const [groupAssignments, setGroupAssignments] = useState<GroupAssignment[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>([]);
  const [tagsInitialized, setTagsInitialized] = useState(false);

  const {
     register,
     handleSubmit,
     watch,
     setValue,
     formState: { errors },
   } = useForm<AttendanceSessionFormData>({
    resolver: zodResolver(attendanceSessionSchema),
    defaultValues: mode === 'edit' && initialData ? {
       name: initialData.name || '',
       occasion_id: initialData.occasion_id,
       start_time: new Date(initialData.start_time).toISOString(),
       end_time: new Date(initialData.end_time).toISOString(),
       is_open: initialData.is_open,
       allow_public_marking: initialData.allow_public_marking,
       proximity_required: initialData.proximity_required,
       location: initialData.location || undefined,
       allowed_tags: initialData.allowed_tags || [],
       allowed_groups: initialData.allowed_groups || [],
       allowed_members: initialData.allowed_members || [],
       marking_modes: initialData.marking_modes,
     } : {
      ...defaultSessionFormValues,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    },
  });

  const watchedValues = watch();
  const proximityRequired = watch('proximity_required');
  const markingModes = watch('marking_modes');
  const watchedAllowedTags = watch('allowed_tags') || [];
  const watchedAllowedGroups = watch('allowed_groups') || [];
  const watchedAllowedMembers = watch('allowed_members') || [];

  const handleFormSubmit = (data: AttendanceSessionFormData) => {
     onSubmit(data);
   };

  const handleMarkingModeChange = (
    mode: 'manual' | 'email' | 'phone' | 'membership_id',
    checked: boolean
  ) => {
    setValue(`marking_modes.${mode}`, checked);
  };

  const handleProximityRequiredChange = (checked: boolean) => {
    setValue('proximity_required', checked);
  };

  // Initialize per-tag values from flattened allowed_tags once tags load
  useEffect(() => {
    if (!tagsInitialized && tags.length > 0) {
      const byTag: Record<string, string[]> = {};
      const selectedIds = Array.isArray(watchedAllowedTags) ? watchedAllowedTags : [];

      tags.forEach((tag) => {
        const itemIds = (tag.tag_items || []).map((ti) => ti.id);
        const matches = selectedIds.filter((id) => itemIds.includes(id));
        byTag[tag.id] = matches;
      });

      setAllowedTagsByTag(byTag);
      setTagsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags]);

  // Seed group assignments from allowed_groups in edit mode (no form writes here to avoid loops)
  useEffect(() => {
    if (mode === 'edit' && groupAssignments.length === 0 && watchedAllowedGroups.length > 0) {
      const seeded = watchedAllowedGroups.map((gid: string) => ({ groupId: gid }));
      setGroupAssignments(seeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedAllowedGroups, mode]);

  // Removed form writes in effects to avoid update loops; members are synced via onChange and details seeding

  // Fetch member details to seed typeahead value in edit mode
  const { data: memberDetails = [] } = useMemberDetails(
    Array.isArray(watchedAllowedMembers) ? watchedAllowedMembers : []
  );

  useEffect(() => {
    if (mode === 'edit' && selectedMembers.length === 0 && memberDetails.length > 0) {
      const seeded: MemberSearchResult[] = memberDetails.map((m: any) => ({
        ...m,
        display_name: m.full_name || `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim(),
        display_subtitle: [m.membership_id, m.email, m.phone].filter(Boolean).join(' • ')
      }));
      setSelectedMembers(seeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberDetails, mode]);

  // Helper to flatten per-tag values back into allowed_tags for the form
  const flattenAllowedTags = (mapping: Record<string, string[]>, allTags: RelationalTagWithItems[]) => {
    const flattened: string[] = [];
    allTags.forEach((tag) => {
      const val = mapping[tag.id];
      const validIds = (tag.tag_items || []).map((ti) => ti.id);
      if (!val) return;
      val.forEach((id) => {
        if (validIds.includes(id)) flattened.push(id);
      });
    });
    return flattened;
  };

  const handleAllowedTagChange = (tagId: string, value: string[]) => {
    const next = { ...allowedTagsByTag, [tagId]: value };
    setAllowedTagsByTag(next);
    const flattened = flattenAllowedTags(next, tags);
    setValue('allowed_tags', flattened);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Session Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter session name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="occasion_id">Occasion *</Label>
            <Select
              value={watchedValues.occasion_id}
              onValueChange={(value) => setValue('occasion_id', value)}
              disabled={mode === 'edit'}
            >
              <SelectTrigger className={cn('w-full', errors.occasion_id ? 'border-red-500' : '')}>
                <SelectValue placeholder="Select an occasion" />
              </SelectTrigger>
              <SelectContent>
                {occasionsLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading occasions...
                    </div>
                  </SelectItem>
                ) : occasions.length === 0 ? (
                  <SelectItem value="no-occasions" disabled>
                    No occasions available
                  </SelectItem>
                ) : (
                  occasions.map((occasion) => (
                    <SelectItem key={occasion.id} value={occasion.id}>
                      {occasion.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.occasion_id && (
              <p className="text-sm text-red-500">{errors.occasion_id.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <DateTimePicker
                dateLabel="Start Date *"
                timeLabel="Start Time *"
                value={watch('start_time')}
                onChange={(value) => setValue('start_time', value)}
                datePlaceholder="Select start date"
                timePlaceholder="Select start time"
              />
              {errors.start_time && (
                <p className="text-sm text-red-500">{errors.start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <DateTimePicker
                dateLabel="End Date *"
                timeLabel="End Time *"
                value={watch('end_time')}
                onChange={(value) => setValue('end_time', value)}
                datePlaceholder="Select end date"
                timePlaceholder="Select end time"
              />
              {errors.end_time && (
                <p className="text-sm text-red-500">{errors.end_time.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

     

      {/* Allowed Tags */}
      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Allowed Tags (Optional)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Restrict attendance to members with specific tags
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {tags.map((tag: RelationalTagWithItems) => (
                <div key={tag.id} className="space-y-2 border border-border p-4 rounded-md">
                  <TagMultiCheckboxRenderer
                    tag={tag}
                    tagKey={tag.id}
                    value={allowedTagsByTag[tag.id] ?? []}
                    onChange={(vals) => handleAllowedTagChange(tag.id, vals)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allowed Groups */}
      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Allowed Groups (Optional)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Restrict attendance to members in selected groups
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <GroupsRenderer
              groups={groups}
              value={groupAssignments}
              onChange={(assignments) => {
                setGroupAssignments(assignments);
                setValue('allowed_groups', assignments.map((a) => a.groupId));
              }}
              allowPositions={false}
            />
            {errors.allowed_groups && (
              <p className="text-sm text-red-500">{errors.allowed_groups.message as string}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Allowed Members */}
      {organizationId && (
        <Card>
          <CardHeader>
            <CardTitle>Allowed Members (Optional)</CardTitle>
            <p className="text-sm text-muted-foreground">Select members permitted to mark attendance</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <MemberSearchTypeahead
              organizationId={organizationId}
              multiSelect
              value={selectedMembers as any}
              onChange={(members) => {
                setSelectedMembers(members as MemberSearchResult[]);
                setValue('allowed_members', members.map((m) => m.id));
              }}
              placeholder="Search and select members"
            />
            {errors.allowed_members && (
              <p className="text-sm text-red-500">{errors.allowed_members.message as string}</p>
            )}
          </CardContent>
        </Card>
      )}

        {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Session Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Status</Label>
              <p className="text-sm text-muted-foreground">
                Whether the session is currently open for attendance marking
              </p>
            </div>
            <Switch
              checked={watchedValues.is_open}
              onCheckedChange={(checked) => setValue('is_open', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Public Marking</Label>
              <p className="text-sm text-muted-foreground">
                Members can self check-in via link
              </p>
            </div>
            <Switch
              checked={watchedValues.allow_public_marking}
              onCheckedChange={(checked) => setValue('allow_public_marking', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Proximity Required</Label>
              <p className="text-sm text-muted-foreground">
                Require users to be within a specific location to mark attendance
              </p>
            </div>
            <Switch
              checked={proximityRequired}
              onCheckedChange={handleProximityRequiredChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Settings */}
      {proximityRequired && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude *</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  placeholder="e.g., 40.7128"
                  {...register('location.lat', { valueAsNumber: true })}
                  className={errors.location?.lat ? 'border-red-500' : ''}
                />
                {errors.location?.lat && (
                  <p className="text-sm text-red-500">{errors.location.lat.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lng">Longitude *</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  placeholder="e.g., -74.0060"
                  {...register('location.lng', { valueAsNumber: true })}
                  className={errors.location?.lng ? 'border-red-500' : ''}
                />
                {errors.location?.lng && (
                  <p className="text-sm text-red-500">{errors.location.lng.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Radius (meters) *</Label>
                <Input
                  id="radius"
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="e.g., 100"
                  {...register('location.radius', { valueAsNumber: true })}
                  className={errors.location?.radius ? 'border-red-500' : ''}
                />
                {errors.location?.radius && (
                  <p className="text-sm text-red-500">{errors.location.radius.message}</p>
                )}
              </div>
            </div>
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location.message}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Marking Modes */}
      <Card>
        <CardHeader>
          <CardTitle>Marking Modes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select how attendance can be marked for this session
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="manual"
                checked={markingModes?.manual || false}
                onCheckedChange={(checked) => handleMarkingModeChange('manual', checked as boolean)}
              />
              <Label htmlFor="manual" className="text-sm font-normal">
                Manual
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="email"
                checked={markingModes?.email || false}
                onCheckedChange={(checked) => handleMarkingModeChange('email', checked as boolean)}
              />
              <Label htmlFor="email" className="text-sm font-normal">
                Email
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="phone"
                checked={markingModes?.phone || false}
                onCheckedChange={(checked) => handleMarkingModeChange('phone', checked as boolean)}
              />
              <Label htmlFor="phone" className="text-sm font-normal">
                Phone
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="membership_id"
                checked={markingModes?.membership_id || false}
                onCheckedChange={(checked) => handleMarkingModeChange('membership_id', checked as boolean)}
              />
              <Label htmlFor="membership_id" className="text-sm font-normal">
                Membership ID
              </Label>
            </div>

            
          </div>
          {errors.marking_modes && (
            <p className="text-sm text-red-500">{errors.marking_modes.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Session' : 'Update Session'}
        </Button>
      </div>
    </form>
  );
}