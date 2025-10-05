/**
 * AttendanceSummaryCard Component
 * Displays attendance statistics and insights for a selected session or date range
 */

import React, { useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  Percent,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAttendanceRecords } from '@/hooks/useAttendance';
import type { SessionStatistics } from '@/types/attendance';

interface AttendanceSummaryCardProps {
  organizationId: string;
  sessionId?: string;
  className?: string;
  showTrends?: boolean;
  compact?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = 'default',
  className 
}: StatCardProps) {
  const colorClasses = {
    default: 'border-border',
    success: 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50',
    warning: 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/50',
    destructive: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50',
  };

  return (
    <Card className={cn('relative overflow-hidden', colorClasses[color], className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <div className={cn(
                  'flex items-center text-xs',
                  trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(trend.value)}%
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AttendanceSummaryCard({
  organizationId,
  sessionId,
  className,
  showTrends = true,
  compact = false,
}: AttendanceSummaryCardProps) {
  const { getRecordsForSession } = useAttendanceRecords(organizationId);

  // Calculate statistics
  const statistics = useMemo((): SessionStatistics => {
    if (!sessionId) {
      return {
        total_expected: 0,
        total_marked: 0,
        present_count: 0,
        absent_count: 0,
        late_count: 0,
        excused_count: 0,
        attendance_percentage: 0,
        on_time_percentage: 0,
      };
    }

    const sessionRecords = getRecordsForSession(sessionId);
    const presentCount = sessionRecords.filter(r => r.is_present).length;
    const totalMarked = sessionRecords.length;
    
    return {
      total_expected: 100, // Mock expected count
      total_marked: totalMarked,
      present_count: presentCount,
      absent_count: totalMarked - presentCount,
      late_count: 0, // Mock data
      excused_count: 0, // Mock data
      attendance_percentage: totalMarked > 0 ? (presentCount / totalMarked) * 100 : 0,
      on_time_percentage: 85, // Mock data
    };
  }, [sessionId, getRecordsForSession]);

  // Mock trend data (in real implementation, this would come from historical data)
  const trends = useMemo(() => ({
    attendance: { value: 5.2, isPositive: true },
    punctuality: { value: 2.1, isPositive: true },
    total: { value: 8.3, isPositive: true },
  }), []);

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Attendance Summary
            </h3>
            <Badge variant="outline">
              {statistics.total_marked} / {statistics.total_expected}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Attendance Rate</span>
                <span className="font-medium">{statistics.attendance_percentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={statistics.attendance_percentage} 
                className="h-2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span>Present: {statistics.present_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-red-600" />
                <span>Absent: {statistics.absent_count}</span>
              </div>
              {statistics.late_count > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span>Late: {statistics.late_count}</span>
                </div>
              )}
              {statistics.excused_count > 0 && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>Excused: {statistics.excused_count}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expected"
          value={statistics.total_expected}
          subtitle="Registered members"
          icon={<Users className="h-5 w-5" />}
          trend={showTrends ? trends.total : undefined}
        />
        
        <StatCard
          title="Present"
          value={statistics.present_count}
          subtitle={`${statistics.attendance_percentage.toFixed(1)}% attendance`}
          icon={<UserCheck className="h-5 w-5" />}
          trend={showTrends ? trends.attendance : undefined}
          color="success"
        />
        
        <StatCard
          title="Absent"
          value={statistics.absent_count}
          subtitle={`${((statistics.absent_count / statistics.total_expected) * 100).toFixed(1)}% of total`}
          icon={<UserX className="h-5 w-5" />}
          color="destructive"
        />
        
        <StatCard
          title="On Time"
          value={`${statistics.on_time_percentage.toFixed(1)}%`}
          subtitle="Punctuality rate"
          icon={<Clock className="h-5 w-5" />}
          trend={showTrends ? trends.punctuality : undefined}
          color={statistics.on_time_percentage >= 80 ? 'success' : 'warning'}
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Attendance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">Present</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{statistics.present_count}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    ({((statistics.present_count / statistics.total_expected) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-sm">Late</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{statistics.late_count}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    ({((statistics.late_count / statistics.total_expected) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm">Excused</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{statistics.excused_count}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    ({((statistics.excused_count / statistics.total_expected) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm">Absent</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{statistics.absent_count}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    ({((statistics.absent_count / statistics.total_expected) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Overall Attendance</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    statistics.attendance_percentage >= 90 
                      ? 'border-green-200 text-green-800 dark:border-green-800 dark:text-green-400'
                      : statistics.attendance_percentage >= 70
                      ? 'border-yellow-200 text-yellow-800 dark:border-yellow-800 dark:text-yellow-400'
                      : 'border-red-200 text-red-800 dark:border-red-800 dark:text-red-400'
                  )}
                >
                  {statistics.attendance_percentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress 
                value={statistics.attendance_percentage} 
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {statistics.attendance_percentage >= 90 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Excellent Attendance
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Attendance rate is above 90%. Great engagement!
                    </p>
                  </div>
                </div>
              )}

              {statistics.on_time_percentage < 70 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                      Punctuality Opportunity
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Consider reminders to improve on-time attendance.
                    </p>
                  </div>
                </div>
              )}

              {statistics.absent_count > statistics.total_expected * 0.3 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/50 rounded-lg">
                  <UserX className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      High Absence Rate
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Consider follow-up with absent members.
                    </p>
                  </div>
                </div>
              )}

              {statistics.total_marked === 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      No Attendance Recorded
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Start marking attendance to see statistics.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}