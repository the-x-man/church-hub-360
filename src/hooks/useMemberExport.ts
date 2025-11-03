import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { MemberSummary } from '@/types/members';
import type { ExportFormat } from '@/components/people/members/MemberExportModal';

interface UseMemberExportProps {
  members: MemberSummary[];
}

export function useMemberExport({ members }: UseMemberExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const { currentOrganization } = useOrganization();

  const handleExport = useCallback(async (
    format: ExportFormat,
    selectedFields: string[]
  ) => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    if (members.length === 0) {
      toast.error('No members to export');
      return;
    }

    setIsExporting(true);
    setExportingFormat(format);

    try {
      // Dynamic import of the export service to avoid loading it unnecessarily
      const { MemberExportService } = await import('@/components/people/members/MemberExportService');
      
      // Create a promise to handle the export completion
      return new Promise<void>((resolve, reject) => {
        // Create a temporary container for the export service
        const container = document.createElement('div');
        document.body.appendChild(container);

        // Import React and ReactDOM for rendering
        import('react').then(React => {
          import('react-dom/client').then(ReactDOM => {
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

            // Render the export service component
            root.render(
              React.createElement(MemberExportService, {
                members,
                selectedFields,
                format,
                organizationName: currentOrganization?.name,
                onComplete: handleComplete,
                onError: handleError,
              })
            );
          });
        });
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
      throw error;
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  }, [members, currentOrganization]);

  return {
    handleExport,
    isExporting,
    exportingFormat,
  };
}
