import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';
import { AttendanceExportModal } from './AttendanceExportModal';
import { useAttendanceExport, type AttendanceExportOptions, type AttendanceExportFormat } from '@/hooks/useAttendanceExport';

interface AttendanceExportButtonsProps {
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
  className?: string;
}

export function AttendanceExportButtons({ report, filtersSummary, className }: AttendanceExportButtonsProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { handleExport, isExporting } = useAttendanceExport({ report, filtersSummary });

  const isDisabled = useMemo(() => !report || (report.summary?.total_attendance ?? 0) === 0, [report]);

  const handleQuickExport = async (format: AttendanceExportFormat) => {
    const defaultOptions: AttendanceExportOptions = {
      sections: ['summary', 'records', 'sessions', 'trend'],
      recordFields: ['session_name', 'marked_at', 'member_name'],
    };
    await handleExport(format, defaultOptions);
  };

  return (
    <div className={className}>
      {/* Desktop: Dropdown + modal launcher */}
      <div className="hidden sm:flex items-center gap-2">
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
            <DropdownMenuItem onClick={() => setIsExportModalOpen(true)} disabled={isDisabled}>
              Custom Export...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: Icon-only button */}
      <div className="sm:hidden">
        <Button variant="outline" size="sm" onClick={() => setIsExportModalOpen(true)} disabled={isDisabled}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Export Modal */}
      <AttendanceExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        report={report ?? null}
        onExport={handleExport}
      />
    </div>
  );
}