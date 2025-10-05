/**
 * CreateOccasionModal Component
 * Modal for creating new occasions with form validation and recurring patterns
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useOccasions } from '@/hooks/useAttendance';
import { cn } from '@/lib/utils';
import type {
  CreateOccasionData,
  Occasion,
  RecurringPattern,
} from '@/types/attendance';
import { AlertCircle, Check, Clock, Plus } from 'lucide-react';
import React, { useState } from 'react';

interface CreateOccasionModalProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onOccasionCreated: (occasion: Occasion) => void;
  defaultValues?: Partial<CreateOccasionData>;
}

const OCCASION_TYPES = [
  {
    value: 'general_service',
    label: 'General Service',
    description: 'Regular worship services',
  },
  {
    value: 'sunday_service',
    label: 'Sunday Service',
    description: 'Sunday morning worship service',
  },
  {
    value: 'midweek_service',
    label: 'Midweek Service',
    description: 'Wednesday or midweek service',
  },
  {
    value: 'evening_service',
    label: 'Evening Service',
    description: 'Evening worship service',
  },
  {
    value: 'youth_meeting',
    label: 'Youth Meeting',
    description: 'Youth group meetings and activities',
  },
  {
    value: 'special_event',
    label: 'Special Event',
    description: 'Special events and programs',
  },
  {
    value: 'wedding',
    label: 'Wedding',
    description: 'Wedding ceremonies',
  },
  {
    value: 'funeral',
    label: 'Funeral',
    description: 'Funeral services',
  },
  {
    value: 'conference',
    label: 'Conference',
    description: 'Church conferences and conventions',
  },
  {
    value: 'retreat',
    label: 'Retreat',
    description: 'Church retreats and camps',
  },
  {
    value: 'outreach',
    label: 'Outreach',
    description: 'Outreach and evangelism activities',
  },
  { value: 'other', label: 'Other', description: 'Other types of gatherings' },
];

const RECURRING_PATTERNS = [
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Every week on the same day',
  },
  { value: 'biweekly', label: 'Bi-weekly', description: 'Every two weeks' },
  { value: 'monthly', label: 'Monthly', description: 'Once per month' },
  { value: 'custom', label: 'Custom', description: 'Custom recurring pattern' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function CreateOccasionModal({
  organizationId,
  isOpen,
  onClose,
  onOccasionCreated,
  defaultValues = {},
}: CreateOccasionModalProps) {
  const { createOccasion } = useOccasions(organizationId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateOccasionData>({
    organization_id: 'org_1', // Mock organization ID - in real app this would come from context/auth
    name: defaultValues.name || '',
    description: defaultValues.description || '',
    type: defaultValues.type || 'sunday_service',
    is_recurring: defaultValues.is_recurring || false,
    recurring_pattern: defaultValues.recurring_pattern || {
      frequency: 'weekly',
      interval: 1,
      days_of_week: [0], // Sunday by default
    },
    is_active:
      defaultValues.is_active !== undefined ? defaultValues.is_active : true,
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Occasion name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Occasion type is required';
    }

    if (formData.is_recurring) {
      if (!formData.recurring_pattern?.frequency) {
        newErrors.recurring_pattern = 'Recurring frequency is required';
      }

      if (
        formData.recurring_pattern?.interval &&
        formData.recurring_pattern.interval < 1
      ) {
        newErrors.interval = 'Interval must be at least 1';
      }

      if (formData.recurring_pattern?.days_of_week?.length === 0) {
        newErrors.days_of_week =
          'At least one day must be selected for recurring occasions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const occasion = await createOccasion(formData);
      onOccasionCreated(occasion);
      handleClose();
    } catch (error) {
      setErrors({ submit: 'Failed to create occasion. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      organization_id: 'org_1', // Mock organization ID - in real app this would come from context/auth
      name: '',
      description: '',
      type: 'sunday_service',
      is_recurring: false,
      recurring_pattern: {
        frequency: 'weekly',
        interval: 1,
        days_of_week: [0],
      },
      is_active: true,
    });
    setErrors({});
    onClose();
  };

  const updateFormData = (updates: Partial<CreateOccasionData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear related errors
    const newErrors = { ...errors };
    Object.keys(updates).forEach((key) => {
      delete newErrors[key];
    });
    setErrors(newErrors);
  };

  const updateRecurringPattern = (updates: Partial<RecurringPattern>) => {
    updateFormData({
      recurring_pattern: {
        ...formData.recurring_pattern!,
        ...updates,
      },
    });
  };

  const toggleDayOfWeek = (day: number) => {
    const currentDays = formData.recurring_pattern?.days_of_week || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();

    updateRecurringPattern({ days_of_week: newDays });
  };

  const selectedType = OCCASION_TYPES.find((t) => t.value === formData.type);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Occasion
          </DialogTitle>
          <DialogDescription>
            Create a new occasion for attendance tracking. You can set up
            recurring patterns for regular events.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Occasion Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="e.g., Sunday Morning Service"
                className={cn(errors.name && 'border-destructive')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  updateFormData({ description: e.target.value })
                }
                placeholder="Optional description of the occasion"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Occasion Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  updateFormData({ type: value as any })
                }
              >
                <SelectTrigger
                  className={cn(errors.type && 'border-destructive')}
                >
                  <SelectValue placeholder="Select occasion type" />
                </SelectTrigger>
                <SelectContent>
                  {OCCASION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type}</p>
              )}
              {selectedType && (
                <p className="text-xs text-muted-foreground">
                  {selectedType.description}
                </p>
              )}
            </div>
          </div>

          {/* Recurring Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_recurring">Recurring Occasion</Label>
                <p className="text-xs text-muted-foreground">
                  Enable if this occasion happens regularly
                </p>
              </div>
              <Switch
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) =>
                  updateFormData({ is_recurring: checked })
                }
              />
            </div>

            {formData.is_recurring && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Recurring Pattern</span>
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.recurring_pattern?.frequency}
                    onValueChange={(value) =>
                      updateRecurringPattern({ frequency: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRING_PATTERNS.map((pattern) => (
                        <SelectItem key={pattern.value} value={pattern.value}>
                          <div>
                            <div className="font-medium">{pattern.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {pattern.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.recurring_pattern && (
                    <p className="text-sm text-destructive">
                      {errors.recurring_pattern}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Interval</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.recurring_pattern?.interval || 1}
                    onChange={(e) =>
                      updateRecurringPattern({
                        interval: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-24"
                  />
                  {errors.interval && (
                    <p className="text-sm text-destructive">
                      {errors.interval}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={
                          formData.recurring_pattern?.days_of_week?.includes(
                            day.value
                          )
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => toggleDayOfWeek(day.value)}
                        className="text-xs"
                      >
                        {day.label.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                  {errors.days_of_week && (
                    <p className="text-sm text-destructive">
                      {errors.days_of_week}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive occasions won't appear in the selector
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                updateFormData({ is_active: checked })
              }
            />
          </div>

          {/* Error Alert */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Occasion
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
