import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';
import { CalendarDays, PercentCircle, Target, Users } from 'lucide-react';
import { useMemo, useRef } from 'react';

interface StatsReportProps {
  report?: AttendanceReportData | null;
  /** Threshold percentage for grading (0–100). Default 75 */
  thresholdPercent?: number;
}

export function StatsReport({
  report,
  thresholdPercent = 75,
}: StatsReportProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    if (!report) {
      return {
        expected: 0,
        total: 0,
        rateFraction: 0,
        ratePercent: 0,
        occasions: 0,
        sessions: 0,
      };
    }
    const expected = report.summary.expected_total_members || 0;
    const total = report.summary.total_attendance || 0;
    const rateFraction = report.summary.attendance_rate || 0;
    const ratePercent = Math.round(rateFraction * 1000) / 10; // one decimal place
    const occasions = report.summary.occasions_count || 0;
    const sessions = report.summary.sessions_count || 0;
    return { expected, total, rateFraction, ratePercent, occasions, sessions };
  }, [report]);

  const grade = useMemo(() => {
    const pct = stats.ratePercent;
    const threshold = thresholdPercent;
    if (pct >= threshold)
      return { label: 'On Track', tone: 'text-green-600 dark:text-green-400' };
    if (pct >= Math.max(0, threshold - 15))
      return {
        label: 'Close to Target',
        tone: 'text-amber-600 dark:text-amber-400',
      };
    return { label: 'Below Target', tone: 'text-red-600 dark:text-red-400' };
  }, [stats.ratePercent, thresholdPercent]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stats Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={printableRef}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="flex items-center gap-3 p-3 rounded-md border bg-neutral-50 dark:bg-neutral-900/40">
            <Target className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">
                Expected (Eligible)
              </div>
              <div className="text-xl font-semibold">{stats.expected}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md border bg-neutral-50 dark:bg-neutral-900/40">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">
                Total Attendance
              </div>
              <div className="text-xl font-semibold">{stats.total}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md border bg-neutral-50 dark:bg-neutral-900/40">
            <PercentCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">
                Attendance Rate
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-xl font-semibold">
                  {stats.ratePercent}%
                </div>
                <div className={`text-xs ${grade.tone}`}>
                  {grade.label} • Target {thresholdPercent}%
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md border bg-neutral-50 dark:bg-neutral-900/40">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">
                Occasions • Sessions
              </div>
              <div className="text-xl font-semibold">
                {stats.occasions} • {stats.sessions}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
