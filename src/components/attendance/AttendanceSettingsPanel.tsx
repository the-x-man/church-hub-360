/**
 * AttendanceSettingsPanel Component
 * Manages attendance settings including marking modes, occasions, and public links
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAttendanceSettings, useOccasions } from '@/hooks/useAttendance';
import type { AttendanceMarkingMode, Occasion } from '@/types/attendance';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Hash,
  Link,
  Mail,
  Phone,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreateOccasionModal } from './CreateOccasionModal';

interface AttendanceSettingsPanelProps {
  organizationId: string;
  onBack?: () => void;
}

const markingModeConfig = {
  phone: {
    icon: Phone,
    label: 'Phone Number',
    description: 'Allow marking attendance using phone numbers',
  },
  email: {
    icon: Mail,
    label: 'Email Address',
    description: 'Allow marking attendance using email addresses',
  },
  membershipId: {
    icon: Hash,
    label: 'Membership ID',
    description: 'Allow marking attendance using membership IDs',
  },
};

export function AttendanceSettingsPanel({
  organizationId,
  onBack,
}: AttendanceSettingsPanelProps) {
  const {
    settings,
    updateSettings,
    resetSettings,
    isLoading: settingsLoading,
  } = useAttendanceSettings(organizationId);
  const { occasions, activeOccasions, deleteOccasion } = useOccasions(
    organizationId
  );

  const [showCreateOccasion, setShowCreateOccasion] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState<Occasion | null>(null);

  const handleMarkingModeToggle = async (
    mode: AttendanceMarkingMode,
    enabled: boolean
  ) => {
    const currentModes = settings.enabled_marking_modes || [];
    let newModes: AttendanceMarkingMode[];

    if (enabled) {
      newModes = [...currentModes, mode];
    } else {
      newModes = currentModes.filter((m) => m !== mode);
    }

    // Ensure at least one mode is enabled
    if (newModes.length === 0) {
      toast.error('At least one marking mode must be enabled');
      return;
    }

    await updateSettings({
      enabled_marking_modes: newModes,
    });
  };

  const handleDefaultOccasionChange = async (occasionId: string) => {
    await updateSettings({
      default_occasion_id: occasionId,
    });
  };

  const handlePublicLinkToggle = async (enabled: boolean) => {
    await updateSettings({
      allow_self_marking: enabled,
    });
  };

  const handleDeleteOccasion = async (occasionId: string) => {
    if (settings.default_occasion_id === occasionId) {
      toast.error(
        'Cannot delete the default occasion. Please set a different default first.'
      );
      return;
    }

    try {
      await deleteOccasion(occasionId);
    } catch (error) {
      console.error('Failed to delete occasion:', error);
    }
  };

  const startEditOccasion = (occasion: Occasion) => {
    setEditingOccasion(occasion);
    setShowCreateOccasion(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-neutral-100 dark:bg-neutral-800/50 px-4 py-2 rounded-md border">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h1 className="text-3xl font-bold tracking-tight">
              Attendance Settings
            </h1>
          </div>
          <p className="text-muted-foreground">
            Configure marking modes, manage occasions, and attendance links.
          </p>
        </div>

        <Button onClick={onBack} size="sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Session
        </Button>
      </div>

      <div className="space-y-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6 col-span-1 md:col-span-1">
          {/* Marking Modes Section */}
          <Card className="border border-primary border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Marking Modes</CardTitle>
              <CardDescription>
                Choose which methods members can use to mark their attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(markingModeConfig).map(([mode, config]) => {
                const Icon = config.icon;
                const isEnabled =
                  settings.enabled_marking_modes?.includes(
                    mode as AttendanceMarkingMode
                  ) || false;

                return (
                  <div
                    key={mode}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="font-medium">{config.label}</Label>
                        <p className="text-sm text-muted-foreground">
                          {config.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        handleMarkingModeToggle(
                          mode as AttendanceMarkingMode,
                          checked
                        )
                      }
                      disabled={settingsLoading}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Public Attendance Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Public Attendance Link</CardTitle>
              <CardDescription>
                Allow members to mark their own attendance using a shareable
                link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Link className="h-5 w-5 text-muted-foreground" />
                  <Label className="font-medium">Enable Public Links</Label>
                </div>
                <Switch
                  checked={settings.allow_self_marking || false}
                  onCheckedChange={handlePublicLinkToggle}
                  disabled={settingsLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 col-span-1 md:col-span-2">
          {/* Occasions Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Occasions & Services
                  </CardTitle>
                  <CardDescription>
                    Manage your church occasions and set the default for quick
                    marking
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowCreateOccasion(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Occasion
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Default Occasion Selector */}
              <div className="space-y-2">
                <Label>Default Occasion for Quick Marking</Label>
                <Select
                  value={settings.default_occasion_id || ''}
                  onValueChange={handleDefaultOccasionChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeOccasions.map((occasion) => (
                      <SelectItem key={occasion.id} value={occasion.id}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {occasion.name}
                          {occasion.is_recurring && (
                            <Badge variant="secondary" className="text-xs">
                              Recurring
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Occasions List */}
              <div className="space-y-2">
                <Label>All Occasions ({occasions.length})</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {occasions.map((occasion) => (
                    <div
                      key={occasion.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{occasion.name}</span>
                            {occasion.is_recurring && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Recurring
                              </Badge>
                            )}
                            {!occasion.is_active && (
                              <Badge variant="outline" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                            {settings.default_occasion_id === occasion.id && (
                              <Badge variant="default" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          {occasion.description && (
                            <p className="text-sm text-muted-foreground">
                              {occasion.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditOccasion(occasion)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOccasion(occasion.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          disabled={
                            settings.default_occasion_id === occasion.id
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reset Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-destructive">
                Reset Settings
              </CardTitle>
              <CardDescription>
                Reset all attendance settings to their default values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={resetSettings}
                disabled={settingsLoading}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Occasion Modal */}
      <CreateOccasionModal
        isOpen={showCreateOccasion}
        onClose={() => {
          setShowCreateOccasion(false);
          setEditingOccasion(null);
        }}
        onOccasionCreated={() => {
          setShowCreateOccasion(false);
          setEditingOccasion(null);
        }}
        defaultValues={editingOccasion || undefined}
        organizationId={organizationId}
      />
    </div>
  );
}
