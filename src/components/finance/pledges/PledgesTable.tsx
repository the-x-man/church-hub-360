import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FinanceDataTable, type TableColumn, type TableAction } from '@/components/finance';
import type { PledgeRecord, DateFilter } from '@/types/finance';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';

interface PledgesTableProps {
  data: PledgeRecord[];
  actions?: TableAction[];
  loading?: boolean;
  // Print metadata
  printTitle?: string;
  printDateFilter?: DateFilter;
  printDateRangeLabel?: string;
  printOrganizationName?: string;
  // Table UI controls
  exportable?: boolean;
  showPrintHeader?: boolean;
}

export function PledgesTable({ data, actions = [], loading, printTitle, printDateFilter, printDateRangeLabel, printOrganizationName, exportable = true, showPrintHeader = true }: PledgesTableProps) {
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const pledgeColumns: TableColumn[] = [
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => {
        try {
          return format(new Date(value), 'MMM dd, yyyy');
        } catch {
          return value;
        }
      },
    },
    { key: 'contributor_name', label: 'Source', sortable: true },
    { key: 'branch', label: 'Branch', sortable: true, render: (_: unknown, row: PledgeRecord) => row.branch?.name || 'All branches' },
    {
      key: 'pledge_type',
      label: 'Pledge Type',
      sortable: true,
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {String(value).replace('_', ' ')}
        </Badge>
      ),
    },
    { key: 'campaign_name', label: 'Campaign', sortable: true, render: (v: string) => v || '-' },
    { key: 'pledge_amount', label: 'Pledge Amount', sortable: true, render: (v: number) => `GHS${v.toLocaleString()}` },
    { key: 'amount_paid', label: 'Amount Paid', sortable: true, render: (v: number) => `GHS${v.toLocaleString()}` },
    { key: 'amount_remaining', label: 'Remaining', sortable: true, render: (v: number) => `GHS${v.toLocaleString()}` },
    {
      key: 'progress',
      label: 'Progress',
      render: (_: unknown, row: PledgeRecord) => {
        const pct = row.pledge_amount > 0 ? (row.amount_paid / row.pledge_amount) * 100 : 0;
        return (
          <div className="space-y-2">
            <Progress value={pct} />
            <p className="text-xs text-muted-foreground">{Math.round(pct)}% complete</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge
          variant={
            value === 'fulfilled'
              ? 'default'
              : value === 'active'
              ? 'secondary'
              : value === 'overdue'
              ? 'destructive'
              : 'outline'
          }
          className="capitalize"
        >
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    { key: 'end_date', label: 'End Date', sortable: true },
  ];

  const sortedData = useMemo(() => {
    if (sortKey === 'branch') {
      const copy = [...data];
      copy.sort((a, b) => {
        const an = (a.branch?.name || '').toLowerCase();
        const bn = (b.branch?.name || '').toLowerCase();
        if (an < bn) return sortDirection === 'asc' ? -1 : 1;
        if (an > bn) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      return copy;
    }
    return data;
  }, [data, sortKey, sortDirection]);

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  return (
    <FinanceDataTable
      data={sortedData}
      columns={pledgeColumns}
      actions={actions}
      loading={loading}
      printTitle={printTitle}
      printDateFilter={printDateFilter}
      printDateRangeLabel={printDateRangeLabel}
      printOrganizationName={printOrganizationName}
      exportable={exportable}
      showPrintHeader={showPrintHeader}
      onSort={handleSort}
      sortKey={sortKey}
      sortDirection={sortDirection}
    />
  );
}