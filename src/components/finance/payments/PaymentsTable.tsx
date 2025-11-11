import React from 'react';
import { FinanceDataTable, type TableColumn, type TableAction } from '@/components/finance';
import type { PledgePayment, DateFilter } from '@/types/finance';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { paymentMethodOptions } from '../constants';

interface PaymentsTableProps {
  data: PledgePayment[];
  onEdit: (record: PledgePayment) => void;
  onDelete: (record: PledgePayment) => void;
  loading?: boolean;
  // Print metadata
  printTitle?: string;
  printDateFilter?: DateFilter;
  printDateRangeLabel?: string;
  printOrganizationName?: string;
}

export const PaymentsTable: React.FC<PaymentsTableProps> = ({ data, onEdit, onDelete, loading, printTitle, printDateFilter, printDateRangeLabel, printOrganizationName }) => {
  const columns: TableColumn[] = [
    {
      key: 'payment_date',
      label: 'Date',
      sortable: true,
      render: (value: string) => {
        try {
          return format(new Date(value), 'MMM dd, yyyy');
        } catch {
          return value;
        }
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: number) => `GHS${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'payment_method',
      label: 'Method',
      sortable: true,
      render: (value: string) => {
        const opt = paymentMethodOptions.find((o) => o.value === value);
        return opt ? opt.label : String(value).replace('_', ' ');
      },
    },
    {
      key: 'created_by_user',
      label: 'Recorded By',
      render: (_: unknown, record: any) => {
        const first = record?.created_by_user?.first_name;
        const last = record?.created_by_user?.last_name;
        const name = `${first || ''} ${last || ''}`.trim();
        return name.length ? name : '-';
      },
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (value: string | undefined) => value || '-',
    },
    {
      key: 'pledge_label',
      label: 'Pledge',
      render: (_: unknown, record: any) => {
        const label = record?.pledge_label as string | undefined;
        if (label && label.trim().length > 0) return label;
        const id = record?.pledge_id ? String(record.pledge_id) : '';
        return (
          <span className="font-mono text-xs text-muted-foreground">{id ? `${id.slice(0, 8)}…` : '-'}</span>
        );
      },
    },
  ];

  const actions: TableAction[] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'destructive',
    },
  ];

  return (
    <FinanceDataTable
      data={data}
      columns={columns}
      actions={actions}
      loading={loading}
      printTitle={printTitle}
      printDateFilter={printDateFilter}
      printDateRangeLabel={printDateRangeLabel}
      printOrganizationName={printOrganizationName}
    />
  );
};