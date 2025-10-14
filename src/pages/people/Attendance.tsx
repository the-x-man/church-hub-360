/**
 * Attendance Page
 * Main attendance tracking interface with modern layout and navigation
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AttendanceStats } from '../../components/attendance/AttendanceStats';
import { OccasionsServices } from '../../components/attendance/OccasionsServices';
import { AttendanceSessions } from '../../components/attendance/AttendanceSessions';
import { MarkAttendance } from '../../components/attendance/MarkAttendance';
import { PublicLinks } from '../../components/attendance/PublicLinks';
import { ReportsInsights } from '../../components/attendance/ReportsInsights';
import { AttendanceSettings } from '../../components/attendance/AttendanceSettings';
import {
  BarChart3,
  Calendar,
  Users,
  CheckCircle,
  Link,
  TrendingUp,
  Settings,
} from 'lucide-react';

export function Attendance() {
  const [activeTab, setActiveTab] = useState('stats');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800/50 px-6 py-4 rounded-lg border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive attendance tracking and management system
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 lg:w-fit lg:grid-cols-7">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="occasions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Occasions</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="mark" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Mark</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            <span className="hidden sm:inline">Links</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <div className="mt-6">
          <TabsContent value="stats" className="space-y-6">
            <AttendanceStats />
          </TabsContent>

          <TabsContent value="occasions" className="space-y-6">
            <OccasionsServices />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <AttendanceSessions />
          </TabsContent>

          <TabsContent value="mark" className="space-y-6">
            <MarkAttendance />
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            <PublicLinks />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsInsights />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AttendanceSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
