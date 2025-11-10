import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FinanceDataTable, type TableColumn, type TableAction } from '@/components/finance';
import type { PledgeRecord } from '@/types/finance';

interface PledgesTableProps {
  data: PledgeRecord[];
  actions?: TableAction[];
  loading?: boolean;
}

export function PledgesTable({ data, actions = [], loading }: PledgesTableProps) {
  const pledgeColumns: TableColumn[] = [
    { key: 'contributor_name', label: 'Source', sortable: true },
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

  return (
    <FinanceDataTable data={data} columns={pledgeColumns} actions={actions} loading={loading} />
  );
}