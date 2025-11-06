import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';
import { useTagsQuery } from '@/hooks/useRelationalTags';
import { useAllGroups } from '@/hooks/useGroups';

export type AttendanceExportFormat = 'pdf' | 'csv' | 'excel';

export interface UseAttendanceExportProps {
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
}

export interface AttendanceExportOptions {
  sections: string[]; // e.g., ['summary','records','sessions','trend','age_groups','gender','members']
  recordFields?: string[]; // e.g., ['session_name','marked_at','member_name','member_gender','member_age']
}

export function useAttendanceExport({ report, filtersSummary }: UseAttendanceExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<AttendanceExportFormat | null>(null);
  const { currentOrganization } = useOrganization();
  const { data: relationalTags = [] } = useTagsQuery(currentOrganization?.id);
  const { data: allGroups = [] } = useAllGroups();

  // Compute selected tag and group names based on current filters and cached data
  const selectedTagNames = useMemo(() => {
    const ids = new Set(filtersSummary?.tag_item_ids || []);
    const names: string[] = [];
    for (const t of relationalTags) {
      for (const item of t.tag_items || []) {
        if (ids.has(item.id)) names.push(String(item.name));
      }
    }
    return names;
  }, [relationalTags, filtersSummary?.tag_item_ids]);

  const selectedGroupNames = useMemo(() => {
    const ids = new Set(filtersSummary?.group_ids || []);
    const names: string[] = [];
    for (const g of allGroups) {
      if (ids.has(g.id)) names.push(String(g.name));
    }
    return names;
  }, [allGroups, filtersSummary?.group_ids]);

  const selectedSessionNames = useMemo(() => {
    const sessions = report?.sessions || [];
    const selectedIds = Array.isArray(filtersSummary?.session_ids)
      ? new Set(filtersSummary!.session_ids!)
      : null;
    // If specific sessions are selected, return only their names; otherwise include all
    const names: string[] = sessions
      .filter((s) => (selectedIds ? selectedIds.has(s.id) : true))
      .map((s: any) => String(s?.name || s?.id || ''));
    return names;
  }, [report?.sessions, filtersSummary?.session_ids]);

  const handleExport = useCallback(async (
    format: AttendanceExportFormat,
    options: AttendanceExportOptions
  ) => {
    if (!report) {
      toast.error('No report data to export');
      return;
    }

    if (!options.sections || options.sections.length === 0) {
      toast.error('Please select at least one section to export');
      return;
    }

    setIsExporting(true);
    setExportingFormat(format);

    try {
      const { AttendanceExportService } = await import('@/components/attendance/export/AttendanceExportService');

      // Render a temporary export service like members flow
      return new Promise<void>((resolve, reject) => {
        const container = document.createElement('div');
        document.body.appendChild(container);

        import('react').then((React) => {
          import('react-dom/client').then((ReactDOM) => {
            const root = ReactDOM.createRoot(container);

            const handleComplete = () => {
              root.unmount();
              document.body.removeChild(container);
              resolve();
            };

            const handleError = (error: string) => {
              toast.error(error);
              root.unmount();
              document.body.removeChild(container);
              reject(new Error(error));
            };

            root.render(
              React.createElement(AttendanceExportService, {
                report,
                filtersSummary,
                format,
                options,
                organizationName: currentOrganization?.name,
                selectedTagNames,
                selectedGroupNames,
                selectedSessionNames,
                onComplete: handleComplete,
                onError: handleError,
              })
            );
          });
        });
      });
    } catch (error) {
      console.error('Attendance export failed:', error);
      toast.error('Attendance export failed. Please try again.');
      throw error;
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  }, [report, filtersSummary, currentOrganization]);

  return {
    handleExport,
    isExporting,
    exportingFormat,
  } as const;
}