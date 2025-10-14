import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Committee } from '@/hooks/useCommittees';
import { toPng } from 'html-to-image';
import { Download, Printer } from 'lucide-react';
import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CommitteeMembersPrintView } from './CommitteeMembersPrintView';

interface CommitteeMember {
  id: string;
  member_id: string;
  member_full_name: string;
  member_email: string | null;
  member_phone: string | null;
  position: string | null;
  assigned_at: string;
}

interface CommitteeMembersPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  committee: Committee;
  members: CommitteeMember[];
  organizationName?: string;
  branchName?: string;
}

export const CommitteeMembersPrintModal = ({
  isOpen,
  onClose,
  committee,
  members,
  organizationName,
  branchName,
}: CommitteeMembersPrintModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${committee.name} - Members Directory`,
    onAfterPrint: () => {
      // log activity
    },
  });

  const handleDownload = async () => {
    if (!printRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(printRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `${committee.name}-members-directory.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating download:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Print Committee Members</span>
            <div className="flex gap-2 px-4">
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                disabled={isDownloading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download PNG'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 printable-content">
          <CommitteeMembersPrintView
            ref={printRef}
            committee={committee}
            members={members}
            organizationName={organizationName}
            branchName={branchName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
