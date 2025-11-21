import React, { useRef, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, Receipt } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { formatDateFilterLabel } from '@/utils/finance/dateRange';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { DateFilter } from '@/types/finance';

// Helper functions for formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount);
};

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Humanize underscore-separated text (e.g., "mobile_payment" -> "Mobile Payment")
const humanizeUnderscore = (value: string) => {
  const spaced = value.replace(/_/g, ' ').trim();
  return spaced.replace(/(^|\s)([a-z])/g, (m) => m.toUpperCase());
};

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
}

export interface TableAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: (record: any) => void;
  variant?: 'default' | 'destructive';
}

interface FinanceDataTableProps {
  data: any[];
  columns: TableColumn[];
  actions?: TableAction[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  emptyMessage?: string;
  exportable?: boolean;
  exportFileName?: string;
  // Print header metadata
  printOrganizationName?: string;
  printTitle?: string; // e.g., "Income", "Contributions and Donations", "Pledges", "Expenses"
  printDateFilter?: DateFilter;
  printDateRangeLabel?: string;
  // Control whether the per-table print header renders (useful for aggregated report prints)
  showPrintHeader?: boolean;
  groupByKey?: string;
}

export const FinanceDataTable: React.FC<FinanceDataTableProps> = ({
  data,
  columns,
  actions = [],
  loading = false,
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = 'No records found',
  exportable = true,
  exportFileName,
  printOrganizationName,
  printTitle,
  printDateFilter,
  printDateRangeLabel,
  showPrintHeader = true,
  groupByKey,
}) => {
  const { currentOrganization } = useOrganization();
  const tableRef = useRef<HTMLDivElement | null>(null);
  const handleSort = (key: string) => {
    if (!onSort) return;

    const newDirection =
      sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const renderCellValue = (column: TableColumn, record: any) => {
    const value = record[column.key];

    if (column.render) {
      return column.render(value, record);
    }

    // Default rendering based on column key patterns
    if (column.key.includes('amount') || column.key.includes('_amount')) {
      return formatCurrency(value || 0);
    }

    if (column.key.includes('date') || column.key.includes('_date')) {
      return formatDate(value);
    }

    if (column.key === 'status') {
      return (
        <Badge
          variant={
            value === 'active' || value === 'fulfilled'
              ? 'default'
              : value === 'pending'
              ? 'secondary'
              : value === 'overdue' || value === 'cancelled'
              ? 'destructive'
              : 'outline'
          }
        >
          {typeof value === 'string' && value.includes('_')
            ? humanizeUnderscore(value)
            : value}
        </Badge>
      );
    }

    if (typeof value === 'string') {
      return value.includes('_') ? humanizeUnderscore(value) : value || '-';
    }
    return value ?? '-';
  };

  // Export helpers
  const formatExportValue = (key: string, value: any) => {
    if (value == null) return '';
    if (key.includes('amount') || key.includes('_amount')) {
      const num = Number(value) || 0;
      return num;
    }
    if (
      key.includes('date') ||
      key.includes('_date') ||
      key === 'created_at' ||
      key === 'updated_at'
    ) {
      try {
        const d = new Date(value);
        return d.toISOString();
      } catch {
        return String(value);
      }
    }
    if (typeof value === 'string' && value.includes('_')) {
      return humanizeUnderscore(value);
    }
    if (typeof value === 'object' && value) {
      const first = (value as any).first_name;
      const last = (value as any).last_name;
      if (first || last) return `${first || ''} ${last || ''}`.trim();
    }
    return typeof value === 'string' ? value : String(value);
  };

  const computeExportRows = () => {
    return data.map((record) => {
      const out: Record<string, any> = {};
      for (const col of columns) {
        out[col.label] = formatExportValue(col.key, (record as any)[col.key]);
      }
      return out;
    });
  };

  // Compute print header metadata
  const orgName =
    printOrganizationName || currentOrganization?.name || 'ChurchHub360';
  const titleLabel = printTitle || 'Finance Records';
  const dateRangeLabel =
    printDateRangeLabel || formatDateFilterLabel(printDateFilter);

  // Build a safe, descriptive base name for exports using the same title naming approach
  const toSafeSegment = (s?: string) =>
    (s || '')
      .trim()
      // remove illegal filename characters on Windows
      .replace(/[\\/:*?"<>|]+/g, '')
      // collapse whitespace to single hyphen
      .replace(/\s+/g, '-')
      // trim leading/trailing hyphens
      .replace(/^-+|-+$/g, '');

  const fileBase =
    exportFileName ||
    [
      toSafeSegment(orgName),
      toSafeSegment(titleLabel),
      toSafeSegment(dateRangeLabel),
    ]
      .filter(Boolean)
      .join('-') + `-${format(new Date(), 'yyyy-MM-dd_HH-mm')}`;

  const handleExportExcel = useCallback(() => {
    if (!data?.length) return;
    const rows = computeExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${fileBase}.xlsx`);
  }, [data, columns, exportFileName]);

  const handleExportCSV = useCallback(() => {
    if (!data?.length) return;
    const rows = computeExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileBase}.csv`);
  }, [data, columns, exportFileName]);

  const handlePrint = useReactToPrint({
    contentRef: tableRef as React.RefObject<HTMLElement>,
    documentTitle: `${orgName ? orgName + ' - ' : ''}${titleLabel} - ${format(
      new Date(),
      'PPP'
    )}`,
    pageStyle: `
      /* Force true landscape via explicit dimensions (Chrome-friendly) */
      @page { size: 297mm 210mm; margin: 0.5in; }
      @media print {
        /* Ensure the print window and content match landscape dimensions */
        html, body { width: 297mm; height: 210mm; overflow: visible !important; }
        /* Remove table container scrollbars and width caps */
        .print-wrapper { width: 297mm !important; max-width: none !important; height: auto !important; overflow: visible !important; }
        [data-slot="table-container"] { overflow: visible !important; max-width: none !important; }
        [data-slot="table-container"]::-webkit-scrollbar { display: none !important; }
        [data-slot="table-container"] { scrollbar-width: none !important; }
        /* Header styling */
        .print-header h1 { font-weight: 700; }
        .print-header h2 { font-weight: 600; color: #374151; }
        .print-header p { color: #6B7280; }
        /* Make table fill available width and avoid row breaks */
        table { width: 100% !important; border-collapse: collapse; table-layout: fixed; }
        th, td { word-break: break-word; }
        [data-slot="table-head"], [data-slot="table-cell"] { white-space: normal !important; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        tr { break-inside: avoid; }
      }
      body { -webkit-print-color-adjust: exact; color-adjust: exact; }
    `,
  });

  // Inject inline style into printed content, matching MembersPrintView approach
  const printPageStyle = `
    @page { size: A4 landscape; margin: 0.5in; }
    @media print {
      body { -webkit-print-color-adjust: exact; color-adjust: exact; }
      .print-wrapper { width: 100% !important; max-width: none !important; }
      [data-slot="table-container"] { overflow: visible !important; max-width: none !important; }
      [data-slot="table-container"]::-webkit-scrollbar { display: none !important; }
      [data-slot="table-container"] { scrollbar-width: none !important; }
      .print-header h1 { font-weight: 700; }
      .print-header h2 { font-weight: 600; }
      .print-header p { color: #6B7280; }
      table { width: 100% !important; border-collapse: collapse; table-layout: fixed; }
      th, td { word-break: break-word; }
      [data-slot="table-head"], [data-slot="table-cell"] { white-space: normal !important; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr { break-inside: avoid; }
    }
  `;

  if (loading) {
    return (
      <div className="rounded-md border">
        {exportable && (
          <div className="flex justify-end gap-2 p-2 border-b bg-muted/50">
            <Button variant="outline" size="sm" disabled>
              CSV
            </Button>
            <Button variant="outline" size="sm" disabled>
              Excel
            </Button>
            <Button variant="outline" size="sm" disabled>
              Print
            </Button>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="w-[50px]"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell>
                    <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      {exportable && (
        <div className="flex justify-end gap-2 p-2 border-b bg-muted/50">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!data?.length}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={!data?.length}
          >
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!data?.length}
          >
            Print
          </Button>
        </div>
      )}
      <div ref={tableRef} className="print-wrapper">
        {/* Inline print CSS to enforce landscape and remove scrollbars when printing */}
        <style>{printPageStyle}</style>
        {/* Print-only header (optional) */}
        {showPrintHeader && (
          <div className="print-header hidden print:block mb-4">
            {orgName && (
              <h2 className="text-gray-700 dark:text-gray-300 text-base">
                {orgName}
              </h2>
            )}
            <h1 className="text-lg font-bold">{titleLabel}</h1>
            <p className="text-sm text-muted-foreground">
              {dateRangeLabel
                ? `${dateRangeLabel}`
                : `Generated on ${format(new Date(), 'PPP')}`}{' '}
              • {data.length} records
            </p>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={
                    column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                  }
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortKey === column.key && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="w-[50px]"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              (() => {
                if (!groupByKey) {
                  return data.map((record, index) => (
                    <TableRow key={record.id || index}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {renderCellValue(column, record)}
                        </TableCell>
                      ))}
                      {actions.length > 0 && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.map((action) => (
                                <DropdownMenuItem
                                  key={action.key}
                                  onClick={() => action.onClick(record)}
                                  className={
                                    action.variant === 'destructive'
                                      ? 'text-destructive'
                                      : ''
                                  }
                                >
                                  {action.icon}
                                  <span className="ml-2">{action.label}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ));
                }
                const groups: Record<string, any[]> = {};
                for (const rec of data) {
                  const g = String(
                    (rec as any)[groupByKey!] ?? 'Uncategorized'
                  );
                  groups[g] = groups[g] || [];
                  groups[g].push(rec);
                }
                const orderedGroups = Object.keys(groups).sort((a, b) =>
                  a.localeCompare(b)
                );
                return orderedGroups.map((grp) => (
                  <React.Fragment key={grp}>
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                      >
                        <div className="font-semibold text-primary">
                          {humanizeUnderscore(grp)} ({groups[grp].length})
                        </div>
                      </TableCell>
                    </TableRow>
                    {groups[grp].map((record, index) => (
                      <TableRow key={(record as any).id || `${grp}-${index}`}>
                        {columns.map((column) => (
                          <TableCell key={column.key}>
                            {renderCellValue(column, record)}
                          </TableCell>
                        ))}
                        {actions.length > 0 && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {actions.map((action) => (
                                  <DropdownMenuItem
                                    key={action.key}
                                    onClick={() => action.onClick(record)}
                                    className={
                                      action.variant === 'destructive'
                                        ? 'text-destructive'
                                        : ''
                                    }
                                  >
                                    {action.icon}
                                    <span className="ml-2">{action.label}</span>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ));
              })()
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Common action configurations
export const commonFinanceActions: TableAction[] = [
  {
    key: 'view',
    label: 'View Details',
    icon: <Eye className="h-4 w-4" />,
    onClick: () => {},
  },
  {
    key: 'edit',
    label: 'Edit',
    icon: <Edit className="h-4 w-4" />,
    onClick: () => {},
  },
  {
    key: 'receipt',
    label: 'Generate Receipt',
    icon: <Receipt className="h-4 w-4" />,
    onClick: () => {},
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: () => {},
    variant: 'destructive' as const,
  },
];
