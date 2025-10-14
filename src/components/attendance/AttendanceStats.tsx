import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  UserCheck,
  UserX,
  Percent,
  Target
} from "lucide-react";

export function AttendanceStats() {
  // Mock data for demonstration
  const stats = {
    totalMembers: 245,
    presentToday: 187,
    absentToday: 58,
    attendanceRate: 76.3,
    thisWeekSessions: 3,
    avgAttendance: 182,
    trend: "+5.2%",
    lastUpdated: "2 hours ago"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Overview</h2>
          <p className="text-muted-foreground">
            Track attendance patterns and member participation
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          <Clock className="w-3 h-3 mr-1" />
          Updated {stats.lastUpdated}
        </Badge>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active church members
            </p>
          </CardContent>
        </Card>

        {/* Present Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">
              Members in attendance
            </p>
          </CardContent>
        </Card>

        {/* Absent Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
            <p className="text-xs text-muted-foreground">
              Members not present
            </p>
          </CardContent>
        </Card>

        {/* Attendance Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Percent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Overall participation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* This Week Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeekSessions}</div>
            <p className="text-xs text-muted-foreground">
              Services held this week
            </p>
          </CardContent>
        </Card>

        {/* Average Attendance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAttendance}</div>
            <p className="text-xs text-muted-foreground">
              Weekly average
            </p>
          </CardContent>
        </Card>

        {/* Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.trend}</div>
            <p className="text-xs text-muted-foreground">
              Compared to last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors">
              <UserCheck className="w-4 h-4" />
              <span className="text-sm">Mark Attendance</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">New Session</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">View Reports</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors">
              <Users className="w-4 h-4" />
              <span className="text-sm">Manage Members</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}