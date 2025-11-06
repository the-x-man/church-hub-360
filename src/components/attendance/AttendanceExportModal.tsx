import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';
import type { AttendanceExportOptions } from '@/hooks/useAttendanceExport';

export type ExportFormat = 'pdf' | 'csv' | 'excel';

interface AttendanceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: AttendanceReportData | null;
  onExport: (format: ExportFormat, options: AttendanceExportOptions) => Promise<void>;
}

const DEFAULT_SECTIONS = ['summary', 'records', 'sessions', 'trend'];
const AVAILABLE_SECTIONS: { key: string; label: string; category: string }[] = [
  { key: 'summary', label: 'Summary Metrics', category: 'overview' },
  { key: 'records', label: 'Attendance Records', category: 'details' },
  { key: 'sessions', label: 'Sessions', category: 'details' },
  { key: 'trend', label: 'Trend (per day)', category: 'details' },
  { key: 'age_groups', label: 'Age Group Breakdown', category: 'demographics' },
  { key: 'gender', label: 'Gender Breakdown', category: 'demographics' },
  { key: 'members', label: 'Members Participated', category: 'participants' },
];

const RECORD_FIELD_OPTIONS = [
  { key: 'session_name', label: 'Session' },
  { key: 'marked_at', label: 'Recorded At' },
  { key: 'member_name', label: 'Member Name' },
  { key: 'member_gender', label: 'Member Gender' },
  { key: 'member_age', label: 'Member Age' },
];

export function AttendanceExportModal({ isOpen, onClose, report, onExport }: AttendanceExportModalProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [recordFields, setRecordFields] = useState<string[]>(['session_name', 'marked_at', 'member_name']);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const groupedSections = useMemo(() => {
    return AVAILABLE_SECTIONS.reduce((acc, s) => {
      acc[s.category] = acc[s.category] || [];
      acc[s.category].push(s);
      return acc;
    }, {} as Record<string, typeof AVAILABLE_SECTIONS>);
  }, []);

  const sectionCategoryLabels: Record<string, string> = {
    overview: 'Overview',
    details: 'Details',
    demographics: 'Demographics',
    participants: 'Participants',
  };

  const handleSectionToggle = (key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSectionSelectAll = (category: string) => {
    const categoryKeys = AVAILABLE_SECTIONS.filter((s) => s.category === category).map((s) => s.key);
    const allSelected = categoryKeys.every((k) => selectedSections.includes(k));
    if (allSelected) {
      setSelectedSections((prev) => prev.filter((k) => !categoryKeys.includes(k)));
    } else {
      setSelectedSections((prev) => Array.from(new Set([...prev, ...categoryKeys])));
    }
  };

  const handleRecordFieldToggle = (key: string) => {
    setRecordFields((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleExport = async (format: ExportFormat) => {
    if (!report) return;
    if (selectedSections.length === 0) return;

    setIsExporting(true);
    setExportingFormat(format);
    try {
      const options: AttendanceExportOptions = {
        sections: selectedSections,
        recordFields,
      };
      await onExport(format, options);
      if (format === 'csv' || format === 'excel') onClose();
    } catch (error) {
      console.error('Attendance export failed:', error);
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Attendance Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            {report ? (
              <>
                Exporting data from {report.summary.sessions_count} sessions • {report.summary.total_attendance} attendance records
              </>
            ) : (
              'No report data available'
            )}
          </div>

          {/* Section Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-medium">Select Sections to Export</h3>
              <div className="text-xs text-muted-foreground">({selectedSections.length} selected)</div>
            </div>

            {Object.entries(groupedSections).map(([category, sections]) => {
              const keys = sections.map((s) => s.key);
              const allSelected = keys.every((k) => selectedSections.includes(k));
              const someSelected = keys.some((k) => selectedSections.includes(k));
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category}`}
                      checked={allSelected}
                      ref={(el) => {
                        const element = el as HTMLInputElement;
                        if (element) element.indeterminate = someSelected && !allSelected;
                      }}
                      onCheckedChange={() => handleSectionSelectAll(category)}
                    />
                    <Label htmlFor={`cat-${category}`} className="text-sm font-medium cursor-pointer">
                      {sectionCategoryLabels[category]}
                    </Label>
                  </div>
                  <div className="ml-6 grid grid-cols-2 gap-2">
                    {sections.map((s) => (
                      <div className="flex items-center space-x-2" key={s.key}>
                        <Checkbox id={`sec-${s.key}`} checked={selectedSections.includes(s.key)} onCheckedChange={() => handleSectionToggle(s.key)} />
                        <Label htmlFor={`sec-${s.key}`} className="text-sm cursor-pointer">
                          {s.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Record Fields */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-medium">Attendance Record Fields</h3>
              <div className="text-xs text-muted-foreground">({recordFields.length} selected)</div>
            </div>
            <div className="ml-1 grid grid-cols-2 gap-2">
              {RECORD_FIELD_OPTIONS.map((f) => (
                <div key={f.key} className="flex items-center space-x-2">
                  <Checkbox id={`rec-${f.key}`} checked={recordFields.includes(f.key)} onCheckedChange={() => handleRecordFieldToggle(f.key)} />
                  <Label htmlFor={`rec-${f.key}`} className="text-sm cursor-pointer">{f.label}</Label>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">Applies when exporting the "Attendance Records" section.</div>
          </div>

          <Separator />

          {/* Export Buttons */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Export Format</h3>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleExport('pdf')}
                disabled={!report || selectedSections.length === 0 || isExporting}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                {isExporting && exportingFormat === 'pdf' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
                <span className="text-xs">PDF/Print</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={!report || selectedSections.length === 0 || isExporting}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                {isExporting && exportingFormat === 'csv' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Download className="h-6 w-6" />
                )}
                <span className="text-xs">CSV File</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleExport('excel')}
                disabled={!report || selectedSections.length === 0 || isExporting}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                {isExporting && exportingFormat === 'excel' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-6 w-6" />
                )}
                <span className="text-xs">Excel File</span>
              </Button>
            </div>
          </div>

          {!report || selectedSections.length === 0 ? (
            <div className="text-sm text-destructive text-center py-2">
              Please select at least one section to export
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}