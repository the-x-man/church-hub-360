import React, { useMemo, useState } from 'react';
import type {
  TableAction,
  TableColumn,
} from '@/components/finance/FinanceDataTable';
import { FinanceDataTable } from '@/components/finance/FinanceDataTable';
import type { IncomeResponseRow, DateFilter } from '@/types/finance';
import { Edit, Eye, Trash2, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ContributionsTableProps {
  data: IncomeResponseRow[];
  onView: (record: IncomeResponseRow) => void;
  onEdit: (record: IncomeResponseRow) => void;
  onDelete: (record: IncomeResponseRow) => void;
  onReceipt?: (record: IncomeResponseRow) => void;
  // Print metadata
  printTitle?: string;
  printDateFilter?: DateFilter;
  printDateRangeLabel?: string;
  printOrganizationName?: string;
}

export const ContributionsTable: React.FC<ContributionsTableProps> = ({
  data,
  onView,
  onEdit,
  onDelete,
  onReceipt,
  printTitle,
  printDateFilter,
  printDateRangeLabel,
  printOrganizationName,
}) => {
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const columns: TableColumn[] = [
    {
      key: 'contributor_name',
      label: 'Contributor',
      sortable: true,
      render: (_value, record) => {
        const r: any = record || {};
        const name: string = r.contributor_name || 'Unknown';
        const sourceType: string = r.source_type || '';

        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        if (sourceType === 'member') {
          const avatarUrl: string | undefined =
            r.contributor_avatar_url ||
            r.member?.profile_image_url ||
            r.members?.profile_image_url;
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[220px]">{name}</span>
            </div>
          );
        }

        if (sourceType === 'tag_item') {
          const color: string | undefined =
            r.contributor_tag_color || r.tag_item?.color || r.tag_items?.color;
          return (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border shrink-0"
                style={{ backgroundColor: color || 'transparent' }}
              />
              <span className="truncate max-w-[220px]">{name}</span>
            </div>
          );
        }

        return <span className="truncate max-w-[240px]">{name}</span>;
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) =>
        `GHS${Number(value).toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })}`,
    },
    {
      key: 'income_type',
      label: 'Income Type',
      sortable: true,
      render: (value) =>
        String(value)
          .replace('_', ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value) =>
        String(value)
          .replace('_', ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      sortable: true,
      render: (value) =>
        String(value)
          .replace('_', ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
    },
    {
      key: 'branch',
      label: 'Branch',
      sortable: true,
      render: (_: any, record: IncomeResponseRow) => record.branch?.name || 'All branches',
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) =>
        format(new Date(String(value)), 'MMM dd, yyyy hh:mm:a'),
    },
    {
      key: 'receipt_issued',
      label: 'Receipt',
      render: (value) => (value ? '✓' : '✗'),
    },
  ];

  const actions: TableAction[] = [
    {
      key: 'view',
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: onView,
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
    },
    {
      key: 'receipt',
      label: 'Receipt',
      icon: <Receipt className="h-4 w-4" />,
      onClick: onReceipt || (() => {}),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'destructive',
    },
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
      columns={columns}
      actions={actions}
      printTitle={printTitle}
      printDateFilter={printDateFilter}
      printDateRangeLabel={printDateRangeLabel}
      printOrganizationName={printOrganizationName}
      onSort={handleSort}
      sortKey={sortKey}
      sortDirection={sortDirection}
    />
  );
};
