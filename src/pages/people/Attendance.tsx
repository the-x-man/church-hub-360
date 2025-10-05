/**
 * Attendance Page
 * Main attendance tracking interface with comprehensive features
 */

import { useState, useEffect } from 'react';
import {
  Calendar,
  Settings,
  Users,
  Link2,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  AttendanceSettingsPanel,
  AttendanceSearch,
  OccasionSelector,
  AttendanceList,
  AttendanceSummaryCard,
} from '@/components/attendance';
import {
  useAttendanceSettings,
  useOccasions,
  useAttendanceSessions,
  useAttendanceRecords,
  usePublicAttendanceLink,
} from '@/hooks/useAttendance';
import { format } from 'date-fns';

export function Attendance() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedOccasionId, setSelectedOccasionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // Get current organization
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id || '';

  // Hooks
  const { settings } = useAttendanceSettings(organizationId, !showSettings);
  const { occasions, activeOccasions } = useOccasions(organizationId);
  const { createSession, getSessionsByDate } = useAttendanceSessions(
    organizationId
  );
  const { getRecordsForSession } = useAttendanceRecords(organizationId);
  const { generateLink, getPublicLinkUrl } = usePublicAttendanceLink();

  // Initialize with default occasion if available
  useEffect(() => {
    if (
      !selectedOccasionId &&
      settings.default_occasion_id &&
      activeOccasions.length > 0
    ) {
      const defaultOccasion = activeOccasions.find(
        (o) => o.id === settings.default_occasion_id
      );
      if (defaultOccasion) {
        setSelectedOccasionId(defaultOccasion.id);
      } else if (activeOccasions.length > 0) {
        setSelectedOccasionId(activeOccasions[0].id);
      }
    }
  }, [settings.default_occasion_id, activeOccasions, selectedOccasionId]);

  // Get or create session for selected occasion and date
  useEffect(() => {
    if (selectedOccasionId && selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const existingSessions = getSessionsByDate(dateString);
      const existingSession = existingSessions.find(
        (s) => s.occasion_id === selectedOccasionId
      );

      if (existingSession) {
        setCurrentSessionId(existingSession.id);
      } else {
        // Create new session
        const createNewSession = async () => {
          const newSession = await createSession({
            organization_id: organizationId,
            occasion_id: selectedOccasionId,
            session_date: dateString,
          });
          setCurrentSessionId(newSession.id);
        };
        createNewSession();
      }
    }
  }, [selectedOccasionId, selectedDate, getSessionsByDate, createSession]);

  const selectedOccasion = occasions.find((o) => o.id === selectedOccasionId);
  const attendanceRecords = currentSessionId
    ? getRecordsForSession(currentSessionId)
    : [];
  const publicLink = currentSessionId ? generateLink(currentSessionId) : null;

  const handleGeneratePublicLink = () => {
    if (!currentSessionId) {
      toast.error('Please select an occasion and date first');
      return;
    }

    try {
      const link = generateLink(currentSessionId);
      if (link) {
        const url = getPublicLinkUrl(link.token);
        navigator.clipboard.writeText(url);
        toast.success('Public attendance link copied to clipboard!');
      } else {
        toast.error('Failed to generate public link');
      }
    } catch (error) {
      toast.error('Failed to generate public link');
    }
  };

  const handleRefresh = () => {
    // In a real app, this would refresh data from the server
    toast.success('Attendance data refreshed');
  };

  const isConfigured =
    settings.enabled_marking_modes.length > 0 && activeOccasions.length > 0;

  {
    /* Settings Panel */
  }
  if (showSettings) {
    return (
      <AttendanceSettingsPanel
        organizationId={organizationId}
        onBack={() => {
          setShowSettings(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800/50 px-4 py-2 rounded-md border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Record and manage membership attendance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Configuration Alert */}
      {!isConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please configure attendance settings and create occasions before
            tracking attendance.
            <Button
              variant="link"
              className="p-0 h-auto ml-2"
              onClick={() => setShowSettings(true)}
            >
              Open Settings
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isConfigured && (
        <>
          {/* Occasion and Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Session Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <OccasionSelector
                    organizationId={organizationId}
                    selectedOccasionId={selectedOccasionId}
                    selectedDate={selectedDate}
                    onOccasionChange={setSelectedOccasionId}
                    onDateChange={setSelectedDate}
                  />
                </div>
                <div className="space-y-4">
                  {selectedOccasion && (
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <h4 className="font-medium mb-2">Current Session</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">
                            Occasion:
                          </span>{' '}
                          {selectedOccasion.name}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Date:</span>{' '}
                          {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Records:
                          </span>{' '}
                          {attendanceRecords.length} members
                        </p>
                      </div>
                    </div>
                  )}

                  {settings.allow_public_links && currentSessionId && (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={handleGeneratePublicLink}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Generate Public Link
                      </Button>
                      {publicLink && (
                        <p className="text-xs text-muted-foreground">
                          Public link active until{' '}
                          {format(
                            new Date(publicLink.expires_at),
                            'MMM dd, HH:mm'
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="attendance"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Mark Attendance
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Attendance List
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Reports & Analytics
              </TabsTrigger>
            </TabsList>

            {/* Mark Attendance Tab */}
            <TabsContent value="attendance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Quick Attendance Marking
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentSessionId ? (
                        <AttendanceSearch
                          organizationId={organizationId}
                          enabledModes={settings.enabled_marking_modes}
                          onMemberSelect={(member) => {
                            toast.success(
                              `Selected ${member.first_name} ${member.last_name} for attendance marking`
                            );
                          }}
                        />
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2" />
                          <p>
                            Select an occasion and date to start marking
                            attendance
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <AttendanceSummaryCard
                    organizationId={organizationId}
                    sessionId={currentSessionId}
                    compact
                  />
                </div>
              </div>
            </TabsContent>

            {/* Attendance List Tab */}
            <TabsContent value="list" className="space-y-6">
              {currentSessionId ? (
                <AttendanceList
                  organizationId={organizationId}
                  sessionId={currentSessionId}
                  occasionId={selectedOccasionId}
                  date={selectedDate}
                />
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Select an occasion and date to view attendance records
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              {currentSessionId ? (
                <AttendanceSummaryCard
                  organizationId={organizationId}
                  sessionId={currentSessionId}
                  showTrends
                />
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Select an occasion and date to view attendance analytics
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
