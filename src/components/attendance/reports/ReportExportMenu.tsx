import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { EmailReportDialog } from '@/components/finance';

interface ReportExportMenuProps {
  filenameBase: string;
  getRows: () => Array<Record<string, unknown>>;
  getSummary?: () => Array<[string, unknown]>;
  printRef?: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
}

export function ReportExportMenu({
  filenameBase,
  getRows,
  getSummary,
  printRef,
  disabled,
}: ReportExportMenuProps) {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const handlePrint = useReactToPrint({ contentRef: printRef as any });

  const exportCSV = () => {
    const rows = getRows();
    const summaryRows = getSummary ? getSummary() : [];

    const escapeCsv = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const parts: string[] = [];
    // Prepend summary section when available
    if (summaryRows && summaryRows.length > 0) {
      parts.push(['Metric', 'Value'].join(','));
      for (const [k, v] of summaryRows) {
        parts.push([escapeCsv(k), escapeCsv(v)].join(','));
      }
      parts.push(''); // blank line between summary and data
    }

    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      parts.push(headers.join(','));
      for (const r of rows) {
        parts.push(headers.map((h) => escapeCsv(r[h])).join(','));
      }
    }

    const csv = parts.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filenameBase}.csv`);
  };

  const exportXLSX = () => {
    const rows = getRows();
    const summaryRows = getSummary ? getSummary() : [];

    // Build Data sheet with summary at the top, then a blank row, then the data table
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const aoa: Array<Array<string | number>> = [];

    if (summaryRows && summaryRows.length > 0) {
      aoa.push(['Metric', 'Value']);
      for (const [k, v] of summaryRows) {
        aoa.push([String(k), typeof v === 'number' ? v : String(v)]);
      }
      aoa.push([]); // spacer
    }

    if (headers.length > 0) {
      aoa.push(headers);
      for (const r of rows) {
        aoa.push(headers.map((h) => {
          const val = r[h];
          return typeof val === 'number' ? val : String(val ?? '');
        }));
      }
    }

    const wb = XLSX.utils.book_new();
    const wsData = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, wsData, 'Data');

    // Also include a dedicated Summary sheet for convenience
    if (summaryRows && summaryRows.length > 0) {
      const summaryAoa: Array<Array<string | number>> = [['Metric', 'Value']];
      for (const [k, v] of summaryRows) {
        summaryAoa.push([String(k), typeof v === 'number' ? v : String(v)]);
      }
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    }

    XLSX.writeFile(wb, `${filenameBase}.xlsx`);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(filenameBase, 10, 10);
    doc.setFontSize(10);
    let y = 18;
    if (getSummary) {
      const summary = getSummary();
      if (summary && summary.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 10, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        summary.forEach(([k, v]) => {
          doc.text(`${k}: ${String(v)}`, 10, y);
          y += 6;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
        y += 4;
      }
    }
    const rows = getRows();
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const line = (txt: string) => {
      doc.text(txt, 10, y);
      y += 5;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    };
    line(headers.join(' | '));
    rows
      .slice(0, 100)
      .forEach((r) => line(headers.map((h) => String(r[h] ?? '')).join(' | ')));
    doc.save(`${filenameBase}.pdf`);
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={!!disabled}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportCSV} disabled={!!disabled}>
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportXLSX} disabled={!!disabled}>
            XLSX
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportPDF} disabled={!!disabled}>
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrint} disabled={!!disabled}>
            Print
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowEmailDialog(true)}
            disabled={!!disabled}
          >
            Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EmailReportDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        onSendEmail={async ({
          recipients: _recipients,
          subject,
          message: _message,
        }) => {
          // Prepare a simple PDF using current rows and summary for email attachment
          try {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            let y = 10;
            doc.setFontSize(14);
            doc.text(subject || filenameBase, 10, y);
            y += 8;
            doc.setFontSize(10);
            const summary = getSummary ? getSummary() : [];
            if (summary && summary.length > 0) {
              doc.setFont('helvetica', 'bold');
              doc.text('Summary', 10, y);
              y += 6;
              doc.setFont('helvetica', 'normal');
              summary.forEach(([k, v]) => {
                doc.text(`${k}: ${String(v)}`, 10, y);
                y += 6;
                if (y > 280) {
                  doc.addPage();
                  y = 20;
                }
              });
              y += 4;
            }
            const rows = getRows();
            const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
            const line = (txt: string) => {
              doc.text(txt, 10, y);
              y += 5;
              if (y > 280) {
                doc.addPage();
                y = 20;
              }
            };
            line(headers.join(' | '));
            rows
              .slice(0, 100)
              .forEach((r) =>
                line(headers.map((h) => String(r[h] ?? '')).join(' | '))
              );
            doc.save(`${filenameBase}.pdf`);
            setShowEmailDialog(false);
          } catch (e) {
            setShowEmailDialog(false);
          }
        }}
      />
    </div>
  );
}
