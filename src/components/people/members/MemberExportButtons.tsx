import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, FileSpreadsheet, Download, ChevronDown } from 'lucide-react';
import { MemberExportModal, type ExportFormat } from './MemberExportModal';
import { useMemberExport } from '@/hooks/useMemberExport';
import type { MemberSummary } from '@/types/members';
import { cn } from '@/lib/utils';

interface MemberExportButtonsProps {
  members: MemberSummary[];
  className?: string;
}

export function MemberExportButtons({
  members,
  className,
}: MemberExportButtonsProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { handleExport, isExporting, exportingFormat } = useMemberExport({ members });

  const handleQuickExport = async (format: ExportFormat) => {
    // Use default fields for quick export
    const defaultFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'membership_type',
      'assigned_tags',
    ];
    
    await handleExport(format, defaultFields);
  };

  const isDisabled = isExporting || members.length === 0;

  return (
    <div className={cn('flex items-center', className)}>
      {/* Desktop: Dropdown with options */}
      <div className="hidden sm:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isDisabled}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? `Exporting ${exportingFormat?.toUpperCase()}...` : 'Export'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsExportModalOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Custom Export...
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickExport('pdf')}>
              <FileText className="h-4 w-4 mr-2" />
              Quick PDF Export
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Quick CSV Export
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickExport('excel')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Quick Excel Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: Icon-only button */}
      <div className="sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExportModalOpen(true)}
          disabled={isDisabled}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Export Modal */}
      <MemberExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        members={members}
        onExport={handleExport}
      />
    </div>
  );
}