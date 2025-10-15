import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SingleBranchSelector } from '@/components/shared/BranchSelector';
import { DurationSelector } from './DurationSelector';
import { RecurrenceSelector } from './RecurrenceSelector';
import { useCreateAttendanceOccasion, useUpdateAttendanceOccasion } from '@/hooks/attendance';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { CreateAttendanceOccasionInput, UpdateAttendanceOccasionInput, AttendanceOccasion } from '@/types/attendance';

// Validation schema based on attendance_occasions table structure
const occasionSchema = z.object({
  name: z.string().min(1, 'Occasion name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().optional(),
  branch_id: z.string().optional(),
  recurrence_rule: z.string().optional(),
  default_duration_minutes: z.number()
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours')
    .optional(),
  is_active: z.boolean().optional().default(true),
});

type OccasionFormData = z.infer<typeof occasionSchema>;

interface OccasionFormProps {
  mode: 'create' | 'edit';
  initialData?: AttendanceOccasion;
  onSuccess?: (occasion: AttendanceOccasion) => void;
  onCancel?: () => void;
}

export function OccasionForm({ 
  mode,
  initialData,
  onSuccess, 
  onCancel
}: OccasionFormProps) {
  const { currentOrganization } = useOrganization();
  const createOccasion = useCreateAttendanceOccasion();
  const updateOccasion = useUpdateAttendanceOccasion();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(occasionSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      branch_id: initialData?.branch_id || undefined,
      recurrence_rule: initialData?.recurrence_rule || '',
      default_duration_minutes: initialData?.default_duration_minutes ?? 60,
      is_active: initialData?.is_active ?? true,
    },
  });

  const isActive = watch('is_active');
  const branchId = watch('branch_id');

  const onSubmit: SubmitHandler<OccasionFormData> = async (data) => {
    try {
      if (mode === 'create') {
        const occasionData: CreateAttendanceOccasionInput = {
          ...data,
          organization_id: currentOrganization?.id || '',
        };
        const result = await createOccasion.mutateAsync(occasionData);
        toast.success('Occasion created successfully');
        onSuccess?.(result);
      } else if (mode === 'edit' && initialData) {
        const updateData: UpdateAttendanceOccasionInput = {
          name: data.name,
          description: data.description,
          recurrence_rule: data.recurrence_rule,
          default_duration_minutes: data.default_duration_minutes,
          is_active: data.is_active,
        };
        const result = await updateOccasion.mutateAsync({
          id: initialData.id,
          updates: updateData,
        });
        toast.success('Occasion updated successfully');
        onSuccess?.(result);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode} occasion`);
    }
  };

  const isLoading = createOccasion.isPending || updateOccasion.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Occasion Name */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">
            Occasion Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g., Sunday Service, Youth Meeting, Bible Study"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Branch Selection */}
        <div className="space-y-2">
          <Label htmlFor="branch">Branch (Optional)</Label>
          <SingleBranchSelector
            value={branchId}
            onValueChange={(value) => setValue('branch_id', value)}
            placeholder="Select a branch"
            className={errors.branch_id ? 'border-red-500' : ''}
          />
          {errors.branch_id && (
            <p className="text-sm text-red-500">{errors.branch_id.message}</p>
          )}
        </div>

        {/* Default Duration */}
        <div className="space-y-2">
          <DurationSelector
            value={watch('default_duration_minutes') ?? 60}
            onChange={(value) => setValue('default_duration_minutes', value)}
            error={errors.default_duration_minutes?.message}
          />
        </div>

        {/* Description */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Brief description of the occasion..."
            rows={3}
            {...register('description')}
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Recurrence Rule */}
        <div className="space-y-2 sm:col-span-2">
          <RecurrenceSelector
            value={watch('recurrence_rule') || ''}
            onChange={(value) => setValue('recurrence_rule', value)}
            error={errors.recurrence_rule?.message}
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-2 sm:col-span-2">
          <Switch
            id="is_active"
            checked={isActive}
            onCheckedChange={(checked) => setValue('is_active', checked)}
          />
          <Label htmlFor="is_active" className="text-sm font-medium">
            Active
          </Label>
          <p className="text-xs text-muted-foreground ml-2">
            {isActive ? 'This occasion is active and can be used for attendance tracking' : 'This occasion is inactive'}
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            mode === 'create' ? 'Create Occasion' : 'Update Occasion'
          )}
        </Button>
      </div>
    </form>
  );
}