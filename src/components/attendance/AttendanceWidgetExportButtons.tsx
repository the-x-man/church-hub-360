import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';
import { useAttendanceExport, type AttendanceExportOptions } from '@/hooks/useAttendanceExport';

interface AttendanceWidgetExportButtonsProps {
  report?: AttendanceReportData | null;
  filtersSummary?: {
    mode: 'occasions_sessions' | 'tags_groups' | 'members';
    date_from?: string;
    date_to?: string;
    occasion_ids?: string[];
    session_ids?: string[];
    tag_item_ids?: string[];
    group_ids?: string[];
    member_ids?: string[];
  };
  defaultSections: string[];
  defaultRecordFields?: string[];
  disabled?: boolean;
  className?: string;
}

export function AttendanceWidgetExportButtons({
  report,
  filtersSummary,
  defaultSections,
  defaultRecordFields,
  disabled,
  className,
}: AttendanceWidgetExportButtonsProps) {
  const { handleExport, isExporting } = useAttendanceExport({ report, filtersSummary });

  // For widget-level exports, rely on parent-provided disabled state and report presence.
  const isDisabled = useMemo(() => disabled || !report, [disabled, report]);

  const quickOptions: AttendanceExportOptions = useMemo(() => ({
    sections: defaultSections,
    recordFields: defaultRecordFields,
  }), [defaultSections, defaultRecordFields]);

  const handleQuickExport = async (format: 'pdf' | 'csv' | 'excel') => {
    await handleExport(format, quickOptions);
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isDisabled}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleQuickExport('pdf')} disabled={isDisabled || isExporting}>
            PDF/Print
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('csv')} disabled={isDisabled || isExporting}>
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('excel')} disabled={isDisabled || isExporting}>
            Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}