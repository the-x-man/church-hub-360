import { Calendar, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { AttendanceSessions } from '../../components/attendance/AttendanceSessions';
import { OccasionsServices } from '../../components/attendance/OccasionsServices';
import { ReportsInsights } from '../../components/attendance/ReportsInsights';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';

export function Attendance() {
  const [activeTab, setActiveTab] = useState('sessions');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800/50 px-6 py-4 rounded-lg border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Attendance Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Attendance tracking and management
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-fit lg:grid-cols-3 border border-primary/20 h-12">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>

          <TabsTrigger value="occasions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Occasions</span>
          </TabsTrigger>

          <TabsTrigger value="reports" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <div className="mt-6">
          <TabsContent value="occasions" className="space-y-6">
            <OccasionsServices />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <AttendanceSessions />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsInsights />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
