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
import { Settings, Clock, MapPin, Users, Loader2 } from 'lucide-react';
import { useAttendanceOccasions } from '@/hooks/attendance/useAttendanceOccasions';
import { useRelationalTags } from '@/hooks/useRelationalTags';
import { TagRenderer } from '@/components/people/tags/TagRenderer';
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

  const handleFormSubmit = (data: AttendanceSessionFormData) => {
     onSubmit(data);
   };

  const handleMarkingModeChange = (mode: keyof typeof markingModes, checked: boolean) => {
    setValue(`marking_modes.${mode}`, checked);
    
    // If proximity mode is enabled, automatically enable proximity_required
    if (mode === 'proximity' && checked) {
      setValue('proximity_required', true);
    }
  };

  const handleProximityRequiredChange = (checked: boolean) => {
    setValue('proximity_required', checked);
    
    // If proximity is disabled, also disable proximity marking mode
    if (!checked && markingModes?.proximity) {
      setValue('marking_modes.proximity', false);
    }
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
             <CardTitle>Tags (Optional)</CardTitle>
             <p className="text-sm text-muted-foreground">
               Restrict attendance to members with specific tags
             </p>
           </CardHeader>
           <CardContent className="space-y-4">
             {tags.map((tag: RelationalTagWithItems) => (
               <div key={tag.id} className="space-y-2">
                 <TagRenderer
                   tag={tag}
                   tagKey={tag.id}
                   value={watchedValues.allowed_tags || []}
                   onChange={(newValue) => {
                     // TagRenderer returns the selected tag item IDs for multiselect
                     setValue('allowed_tags', Array.isArray(newValue) ? newValue : []);
                   }}
                   error={errors.allowed_tags?.message}
                   className="w-full"
                 />
               </div>
             ))}
           </CardContent>
         </Card>
       )}

        {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
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
                Allow non-members to mark attendance
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
          <CardTitle>Attendance Marking Modes</CardTitle>
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
                Manual marking by administrators
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="qr_code"
                checked={markingModes?.qr_code || false}
                onCheckedChange={(checked) => handleMarkingModeChange('qr_code', checked as boolean)}
              />
              <Label htmlFor="qr_code" className="text-sm font-normal">
                QR code scanning
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="proximity"
                checked={markingModes?.proximity || false}
                onCheckedChange={(checked) => handleMarkingModeChange('proximity', checked as boolean)}
              />
              <Label htmlFor="proximity" className="text-sm font-normal">
                Proximity-based marking
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="self_checkin"
                checked={markingModes?.self_checkin || false}
                onCheckedChange={(checked) => handleMarkingModeChange('self_checkin', checked as boolean)}
              />
              <Label htmlFor="self_checkin" className="text-sm font-normal">
                Self check-in
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