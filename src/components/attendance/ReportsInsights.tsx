import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DatePresetPicker, type DatePresetValue } from '@/components/attendance/reports/DatePresetPicker';
import { OccasionsSessionsFilter, type OccasionSessionMode } from '@/components/attendance/reports/OccasionsSessionsFilter';
import { DemographicsFilter, type DemographicKey } from '@/components/attendance/reports/DemographicsFilter';
import { TagsGroupsMembersFilter } from '@/components/attendance/reports/TagsGroupsMembersFilter';
import { useAttendanceReport } from '@/hooks/attendance/useAttendanceReports';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { EmailReportDialog } from '@/components/finance';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  Download,
  Filter,
  Eye,
  FileText,
  Mail,
} from 'lucide-react';

export function ReportsInsights() {
  // Date preset state
  const [datePreset, setDatePreset] = useState<DatePresetValue>(() => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    return { preset: 'last_30_days', range: { from, to: now } };
  });

  // Occasion/session scope state
  const [scopeMode, setScopeMode] = useState<OccasionSessionMode>('all');
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  // Demographics and associations
  const [demoGroups, setDemoGroups] = useState<DemographicKey[]>([]);
  const [tagItemIds, setTagItemIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  // Filters panel visibility
  const [showFilters, setShowFilters] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  // Compose query params
  const queryParams = useMemo(() => {
    const date_from = datePreset.range.from.toISOString();
    const date_to = datePreset.range.to.toISOString();
    const base: any = {
      date_from,
      date_to,
    };
    if (scopeMode === 'selected') {
      if (selectedOccasions.length > 0) base.occasion_ids = selectedOccasions;
      if (selectedSessions.length > 0) base.session_ids = selectedSessions;
    }
    if (tagItemIds.length > 0) base.tag_item_ids = tagItemIds;
    if (groupIds.length > 0) base.group_ids = groupIds;
    if (memberIds.length > 0) base.member_ids = memberIds;
    if (demoGroups.length > 0) base.demographic_groups = demoGroups;
    return base;
  }, [datePreset, scopeMode, selectedOccasions, selectedSessions, tagItemIds, groupIds, memberIds, demoGroups]);

  const { data: report, isLoading, error } = useAttendanceReport(queryParams);

  // Derived metrics for UI
  const avgAttendance = report?.summary.average_per_day ?? 0;
  const peakDayLabel = report?.summary.peak_day?.date
    ? new Date(report.summary.peak_day.date).toLocaleDateString()
    : '—';

  // Growth rate: last 7 days vs previous 7 days
  const growthRate = useMemo(() => {
    if (!report?.trend || report.trend.length === 0) return null;
    const sorted = [...report.trend].sort((a, b) => (a.date < b.date ? -1 : 1));
    const last14 = sorted.slice(-14);
    const last7 = last14.slice(-7);
    const prev7 = last14.slice(0, Math.max(0, last14.length - 7));
    const sum = (arr: typeof sorted) => arr.reduce((s, p) => s + p.count, 0);
    const lastSum = sum(last7);
    const prevSum = sum(prev7);
    if (prevSum === 0) return lastSum > 0 ? 100 : 0;
    return Math.round(((lastSum - prevSum) / prevSum) * 100);
  }, [report?.trend]);

  // Consistency: % of members with >=2 attendances in range
  const consistencyRate = useMemo(() => {
    if (!report?.records || report.records.length === 0) return null;
    const countByMember = new Map<string, number>();
    for (const r of report.records) {
      countByMember.set(r.member_id, (countByMember.get(r.member_id) || 0) + 1);
    }
    const members = countByMember.size;
    const regulars = Array.from(countByMember.values()).filter((c) => c >= 2).length;
    if (members === 0) return 0;
    return Math.round((regulars / members) * 100);
  }, [report?.records]);

  // Export handlers
  const exportCSV = () => {
    if (!report) return;
    const header = ['Date', 'Session', 'Member ID'];
    const sessionNameById = new Map(report.sessions.map((s) => [s.id, (s as any).name || 'Session']));
    const rows = report.records.map((r) => [
      new Date(r.marked_at).toLocaleString(),
      sessionNameById.get(r.session_id) || r.session_id,
      r.member_id,
    ]);
    const csv = [header.join(','), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'attendance-report.csv');
  };

  const exportXLSX = () => {
    if (!report) return;
    const sessionNameById = new Map(report.sessions.map((s) => [s.id, (s as any).name || 'Session']));
    const records = report.records.map((r) => ({
      Date: new Date(r.marked_at).toLocaleString(),
      Session: sessionNameById.get(r.session_id) || r.session_id,
      MemberId: r.member_id,
    }));
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const summary = [
      ['Total Attendance', report.summary.total_attendance],
      ['Unique Members', report.summary.unique_members],
      ['Sessions', report.summary.sessions_count],
      ['Avg/Day', report.summary.average_per_day],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
    XLSX.writeFile(wb, 'attendance-report.xlsx');
  };

  const exportPDF = async () => {
    if (!report) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(14);
    doc.text('Attendance Report', 10, y);
    y += 8;
    doc.setFontSize(10);
    const lines = [
      `Date Range: ${datePreset.range.from.toLocaleDateString()} – ${datePreset.range.to.toLocaleDateString()}`,
      `Total Attendance: ${report.summary.total_attendance}`,
      `Unique Members: ${report.summary.unique_members}`,
      `Sessions: ${report.summary.sessions_count}`,
      `Avg/Day: ${report.summary.average_per_day}`,
      `Peak Day: ${peakDayLabel}`,
    ];
    lines.forEach((t) => { doc.text(t, 10, y); y += 6; });
    doc.save('attendance-report.pdf');
  };

  const printableRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printableRef });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Reports & Insights</h2>
          <p className="text-muted-foreground">Analyze attendance patterns and generate reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowFilters((v) => !v)} className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            { (selectedOccasions.length + selectedSessions.length + tagItemIds.length + groupIds.length + memberIds.length + demoGroups.length) > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {selectedOccasions.length + selectedSessions.length + tagItemIds.length + groupIds.length + memberIds.length + demoGroups.length}
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={!report}><Download className="w-4 h-4 mr-2" />CSV</Button>
          <Button variant="outline" onClick={exportXLSX} disabled={!report}><Download className="w-4 h-4 mr-2" />XLSX</Button>
          <Button variant="outline" onClick={exportPDF} disabled={!report}><Download className="w-4 h-4 mr-2" />PDF</Button>
          <Button variant="outline" onClick={handlePrint} disabled={!report}><Download className="w-4 h-4 mr-2" />Print</Button>
          <Button variant="outline" onClick={() => setShowEmailDialog(true)} disabled={!report}><Mail className="w-4 h-4 mr-2" />Email</Button>
        </div>
      </div>

      {/* Date Preset */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <DatePresetPicker value={datePreset} onChange={setDatePreset} />
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OccasionsSessionsFilter
              mode={scopeMode}
              onModeChange={setScopeMode}
              selectedOccasionIds={selectedOccasions}
              onOccasionsChange={setSelectedOccasions}
              selectedSessionIds={selectedSessions}
              onSessionsChange={setSelectedSessions}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DemographicsFilter selected={demoGroups} onChange={setDemoGroups} />
              <TagsGroupsMembersFilter
                tagItemIds={tagItemIds}
                onTagItemIdsChange={setTagItemIds}
                groupIds={groupIds}
                onGroupIdsChange={setGroupIds}
                memberIds={memberIds}
                onMemberIdsChange={setMemberIds}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading / Error */}
      {isLoading && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Building report…</p>
        </div>
      )}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">Failed to load report</p>
        </div>
      )}

      {/* Quick Insights */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" ref={printableRef}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgAttendance}</div>
              <p className="text-xs text-muted-foreground">per day</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{growthRate !== null ? `${growthRate}%` : '—'}</div>
              <p className="text-xs text-muted-foreground">last 7 vs prior 7</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{peakDayLabel}</div>
              <p className="text-xs text-muted-foreground">highest attendance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consistency</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consistencyRate !== null ? `${consistencyRate}%` : '—'}</div>
              <p className="text-xs text-muted-foreground">members with ≥2 attendances</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {report.trend.length === 0 ? (
                <div className="h-64 flex items-center justify-center border rounded-lg">
                  <p className="text-muted-foreground">No data for selected range</p>
                </div>
              ) : (
                <div className="h-64 flex items-end gap-2 p-2 border rounded-lg">
                  {(() => {
                    const max = Math.max(...report.trend.map((t) => t.count));
                    return report.trend.map((t) => (
                      <div key={t.date} className="flex flex-col items-center">
                        <div
                          className="bg-primary/60 dark:bg-primary/70 w-4 rounded"
                          style={{ height: `${(t.count / max) * 100}%` }}
                          title={`${new Date(t.date).toLocaleDateString()} • ${t.count}`}
                        />
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.sessionBreakdown.slice(0, 8).map((s) => (
                  <div key={s.session_id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.session_name || 'Session'}</div>
                      <Progress value={Math.min(100, (s.count / (report.summary.total_attendance || 1)) * 100)} className="h-2" />
                    </div>
                    <div className="text-sm text-muted-foreground">{s.count}</div>
                  </div>
                ))}
                {report.sessionBreakdown.length === 0 && (
                  <p className="text-muted-foreground">No sessions in range</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Demographics */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age groups */}
              <div>
                <div className="text-sm font-medium mb-2">Age Groups</div>
                {Object.entries(report.demographic.byAgeGroup).map(([label, count]) => (
                  <div key={label} className="mb-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{label}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <Progress value={Math.min(100, (count / (report.summary.unique_members || 1)) * 100)} className="h-2" />
                  </div>
                ))}
                {Object.keys(report.demographic.byAgeGroup).length === 0 && (
                  <p className="text-muted-foreground">No age data</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <div className="text-sm font-medium mb-2">Gender</div>
                {Object.entries(report.demographic.byGender).map(([label, count]) => (
                  <div key={label} className="mb-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{label}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <Progress value={Math.min(100, (count / (report.summary.unique_members || 1)) * 100)} className="h-2" />
                  </div>
                ))}
                {Object.keys(report.demographic.byGender).length === 0 && (
                  <p className="text-muted-foreground">No gender data</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Templates (placeholders retained) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Weekly Summary</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Overview of weekly attendance patterns</p>
              <Button size="sm" variant="outline" className="w-full">
                <Eye className="w-3 h-3 mr-1" />
                Generate
              </Button>
            </div>

            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Monthly Report</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Comprehensive monthly attendance analysis</p>
              <Button size="sm" variant="outline" className="w-full">
                <Eye className="w-3 h-3 mr-1" />
                Generate
              </Button>
            </div>

            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">Member Insights</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Individual member attendance patterns</p>
              <Button size="sm" variant="outline" className="w-full">
                <Eye className="w-3 h-3 mr-1" />
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Report Name</div>
                  <div className="text-sm text-muted-foreground">Generated on Date</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">PDF</Badge>
                <Button size="sm" variant="outline">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Another Report</div>
                  <div className="text-sm text-muted-foreground">Generated on Date</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Excel</Badge>
                <Button size="sm" variant="outline">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Report Dialog */}
      <EmailReportDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        onSendEmail={async ({ recipients, subject, message }) => {
          if (!report) return;
          try {
            // Build a simple PDF attachment in-memory
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            let y = 10;
            doc.setFontSize(14);
            doc.text(subject || 'Attendance Report', 10, y);
            y += 8;
            doc.setFontSize(10);
            const lines = [
              `Date Range: ${datePreset.range.from.toLocaleDateString()} – ${datePreset.range.to.toLocaleDateString()}`,
              `Total Attendance: ${report.summary.total_attendance}`,
              `Unique Members: ${report.summary.unique_members}`,
              `Sessions: ${report.summary.sessions_count}`,
              `Avg/Day: ${report.summary.average_per_day}`,
              `Peak Day: ${peakDayLabel}`,
              '',
              message || 'Please find the attached attendance report.',
            ];
            lines.forEach((t) => { doc.text(t, 10, y); y += 6; });

            // NOTE: Email sending integration can be wired to backend.
            // For now, provide user feedback and download locally so they can attach.
            doc.save('attendance-report.pdf');
            toast.success(`Prepared report for ${recipients.length} recipient(s). Downloaded PDF for attachment.`);
          } catch (e) {
            toast.error('Failed to prepare email report');
          }
        }}
      />
    </div>
  );
}
