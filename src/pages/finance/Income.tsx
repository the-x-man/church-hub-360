import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Edit, Trash2, Eye, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Finance components
import {
  FinanceDataTable,
  FinanceFilterBar,
  FinanceStatsCards,
  FinanceReportGenerator,
  incomeStatsConfig,
} from '@/components/finance';
import type { TableColumn, TableAction } from '@/components/finance';

// Types and mock data
import type {
  IncomeRecord,
  IncomeFormData,
  ExtendedIncomeType,
  PaymentMethod,
  FinanceFilter,
  ReportConfig,
} from '@/types/finance';
import {
  mockIncomeRecords,
  generateMockIncomeRecord,
} from '@/data/mock/finance';

const Income: React.FC = () => {
  // State management
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>(
    mockIncomeRecords
  );
  const [filters, setFilters] = useState<FinanceFilter>({
    date_filter: { type: 'preset', preset: 'this_month' },
  });
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IncomeRecord | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<IncomeFormData>({
    amount: 0,
    extended_income_type: 'Offering',
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
  });

  // Occasion type options
  const occasionTypeOptions = [
    { value: 'Offering', label: 'Offering' },
    { value: 'Tithe', label: 'Tithe' },
    { value: 'Contribution', label: 'Contribution' },
    { value: 'Donation', label: 'Donation' },
    { value: 'Fundraising', label: 'Fundraising' },
    { value: 'Special Offering', label: 'Special Offering' },
    { value: 'Thanksgiving', label: 'Thanksgiving' },
    { value: 'Harvest', label: 'Harvest' },
    { value: 'Special Thanksgiving', label: 'Special Thanksgiving' },
    { value: 'Fund', label: 'Fund' },
    { value: 'Grant', label: 'Grant' },
    { value: 'Special Grant', label: 'Special Grant' },
    { value: 'Other', label: 'Other' },
  ];

  // Payment method options
  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'mobile_payment', label: 'Mobile Payment' },
    { value: 'online', label: 'Online' },
    { value: 'other', label: 'Other' },
  ];

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...incomeRecords];

    // Apply filters (simplified for demo)
    if (filters.category_filter?.length) {
      filtered = filtered.filter((record) =>
        filters.category_filter!.includes(record.extended_income_type)
      );
    }

    if (filters.payment_method_filter?.length) {
      filtered = filtered.filter((record) =>
        filters.payment_method_filter!.includes(record.payment_method)
      );
    }

    if (filters.amount_range?.min !== undefined) {
      filtered = filtered.filter(
        (record) => record.amount >= filters.amount_range!.min!
      );
    }

    if (filters.amount_range?.max !== undefined) {
      filtered = filtered.filter(
        (record) => record.amount <= filters.amount_range!.max!
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortKey as keyof IncomeRecord];
      let bValue = b[sortKey as keyof IncomeRecord];

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [incomeRecords, filters, sortKey, sortDirection]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalIncome = filteredAndSortedData.reduce(
      (sum, record) => sum + record.amount,
      0
    );
    const recordCount = filteredAndSortedData.length;
    const averageIncome = recordCount > 0 ? totalIncome / recordCount : 0;

    // Find top occasion
    const occasionTotals = filteredAndSortedData.reduce((acc, record) => {
      acc[record.extended_income_type] =
        (acc[record.extended_income_type] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

    const topOccasionEntry = Object.entries(occasionTotals).sort(
      ([, a], [, b]) => b - a
    )[0];
    const topOccasion = topOccasionEntry ? topOccasionEntry[0] : 'N/A';
    const topOccasionAmount = topOccasionEntry ? topOccasionEntry[1] : 0;

    return incomeStatsConfig({
      totalIncome,
      recordCount,
      averageIncome,
      topOccasion:
        occasionTypeOptions.find((opt) => opt.value === topOccasion)?.label ||
        topOccasion,
      topOccasionAmount,
    });
  }, [filteredAndSortedData]);

  // Table columns
  const columns: TableColumn[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
    },
    {
      key: 'extended_income_type',
      label: 'Occasion',
      render: (value) =>
        occasionTypeOptions.find((opt) => opt.value === value)?.label || value,
    },
    {
      key: 'occasion_name',
      label: 'Occasion Name',
      render: (value) => value || '-',
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      render: (value) =>
        paymentMethodOptions.find((opt) => opt.value === value)?.label || value,
    },
    {
      key: 'source',
      label: 'Source',
      render: (value) => value || '-',
    },
    {
      key: 'receipt_number',
      label: 'Receipt #',
      render: (value) => value || '-',
    },
  ];

  // Table actions
  const actions: TableAction[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (record) => {
        setSelectedRecord(record);
        setShowViewDialog(true);
      },
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (record) => {
        setSelectedRecord(record);
        setFormData({
          amount: record.amount,
          extended_income_type: record.extended_income_type,
          occasion_name: record.occasion_name || '',
          source: record.source || '',
          payment_method: record.payment_method,
          date: record.date,
          description: record.description || '',
          notes: record.notes || '',
          receipt_number: record.receipt_number || '',
        });
        setShowEditDialog(true);
      },
    },
    {
      key: 'receipt',
      label: 'Generate Receipt',
      icon: <Receipt className="h-4 w-4" />,
      onClick: (record) => {
        toast.success(
          `Receipt generated for ${record.receipt_number || 'income record'}`
        );
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (record) => {
        if (confirm('Are you sure you want to delete this income record?')) {
          setIncomeRecords((prev) => prev.filter((r) => r.id !== record.id));
          toast.success('Income record deleted successfully');
        }
      },
      variant: 'destructive',
    },
  ];

  // Form handlers
  const resetForm = () => {
    setFormData({
      amount: 0,
      extended_income_type: 'Offering',
      payment_method: 'cash',
      date: new Date().toISOString().split('T')[0],
      description: '',
      notes: '',
    });
  };

  const handleAdd = () => {
    setLoading(true);
    setTimeout(() => {
      const newRecord = generateMockIncomeRecord({
        ...formData,
        id: `income-${Date.now()}`,
        receipt_number: `INC-2024-${String(incomeRecords.length + 1).padStart(
          3,
          '0'
        )}`,
      });
      setIncomeRecords((prev) => [newRecord, ...prev]);
      setShowAddDialog(false);
      resetForm();
      setLoading(false);
      toast.success('Income record added successfully');
    }, 1000);
  };

  const handleEdit = () => {
    if (!selectedRecord) return;

    setLoading(true);
    setTimeout(() => {
      setIncomeRecords((prev) =>
        prev.map((record) =>
          record.id === selectedRecord.id
            ? { ...record, ...formData, updated_at: new Date().toISOString() }
            : record
        )
      );
      setShowEditDialog(false);
      setSelectedRecord(null);
      resetForm();
      setLoading(false);
      toast.success('Income record updated successfully');
    }, 1000);
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleGenerateReport = (config: ReportConfig) => {
    toast.success(`Generating ${config.title} report...`);
    // In a real app, this would trigger report generation
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Income Management</h1>
          <p className="text-muted-foreground">
            Track and manage church income from various sources and occasions
          </p>
        </div>
        <div className="flex gap-2">
          <FinanceReportGenerator
            title="Income"
            data={filteredAndSortedData}
            filters={filters}
            onGenerateReport={handleGenerateReport}
            availableGroupBy={[
              { value: 'extended_income_type', label: 'Occasion Type' },
              { value: 'payment_method', label: 'Payment Method' },
              { value: 'source', label: 'Source' },
              { value: 'date', label: 'Date' },
            ]}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <FinanceStatsCards stats={stats} loading={loading} />

      {/* Filter Bar */}
      <FinanceFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        categoryOptions={occasionTypeOptions}
        paymentMethodOptions={paymentMethodOptions}
        searchPlaceholder="Search income records..."
        onAddClick={() => setShowAddDialog(true)}
        addButtonLabel="Add Income"
      />

      {/* Data Table */}
      <FinanceDataTable
        data={filteredAndSortedData}
        columns={columns}
        actions={actions}
        loading={loading}
        onSort={handleSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
        emptyMessage="No income records found"
      />

      {/* Add Income Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Income Record</DialogTitle>
            <DialogDescription>
              Record a new income entry for the church
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="extended_income_type">Occasion Type *</Label>
              <Select
                value={formData.extended_income_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
          extended_income_type: value as ExtendedIncomeType,
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {occasionTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="occasion_name">Occasion Name</Label>
              <Input
                id="occasion_name"
                value={formData.occasion_name || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    occasion_name: e.target.value,
                  }))
                }
                className="mt-1"
                placeholder="e.g., Sunday Morning Service"
              />
            </div>

            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, source: e.target.value }))
                }
                className="mt-1"
                placeholder="e.g., Congregation, Special Collection"
              />
            </div>

            <div>
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_method: value as PaymentMethod,
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date
                      ? format(new Date(formData.date), 'PPP')
                      : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.date ? new Date(formData.date) : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        setFormData((prev) => ({
                          ...prev,
                          date: date.toISOString().split('T')[0],
                        }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="receipt_number">Receipt Number</Label>
              <Input
                id="receipt_number"
                value={formData.receipt_number || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    receipt_number: e.target.value,
                  }))
                }
                className="mt-1"
                placeholder="Auto-generated if empty"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="mt-1"
                rows={3}
                placeholder="Brief description of the income..."
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="mt-1"
                rows={2}
                placeholder="Additional notes or comments..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={loading || !formData.amount}>
              {loading ? 'Adding...' : 'Add Income'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Income Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Income Record</DialogTitle>
            <DialogDescription>
              Update the income record details
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Same form fields as Add dialog */}
            <div>
              <Label htmlFor="edit_amount">Amount *</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit_occasion_type">Occasion Type *</Label>
              <Select
                value={formData.extended_income_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
          extended_income_type: value as ExtendedIncomeType,
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {occasionTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_occasion_name">Occasion Name</Label>
              <Input
                id="edit_occasion_name"
                value={formData.occasion_name || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    occasion_name: e.target.value,
                  }))
                }
                className="mt-1"
                placeholder="e.g., Sunday Morning Service"
              />
            </div>

            <div>
              <Label htmlFor="edit_source">Source</Label>
              <Input
                id="edit_source"
                value={formData.source || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, source: e.target.value }))
                }
                className="mt-1"
                placeholder="e.g., Congregation, Special Collection"
              />
            </div>

            <div>
              <Label htmlFor="edit_payment_method">Payment Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_method: value as PaymentMethod,
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_date">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date
                      ? format(new Date(formData.date), 'PPP')
                      : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.date ? new Date(formData.date) : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        setFormData((prev) => ({
                          ...prev,
                          date: date.toISOString().split('T')[0],
                        }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="edit_receipt_number">Receipt Number</Label>
              <Input
                id="edit_receipt_number"
                value={formData.receipt_number || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    receipt_number: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="mt-1"
                rows={3}
                placeholder="Brief description of the income..."
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="mt-1"
                rows={2}
                placeholder="Additional notes or comments..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading || !formData.amount}>
              {loading ? 'Updating...' : 'Update Income'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Income Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Income Record Details</DialogTitle>
            <DialogDescription>
              View detailed information about this income record
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Amount
                </Label>
                <p className="text-lg font-semibold">
                  GHS{selectedRecord.amount.toLocaleString()}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Occasion Type
                </Label>
                <p>
                  {
                    occasionTypeOptions.find(
                      (opt) => opt.value === selectedRecord.extended_income_type
                    )?.label
                  }
                </p>
              </div>

              {selectedRecord.occasion_name && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Occasion Name
                  </Label>
                  <p>{selectedRecord.occasion_name}</p>
                </div>
              )}

              {selectedRecord.source && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Source
                  </Label>
                  <p>{selectedRecord.source}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Payment Method
                </Label>
                <p>
                  {
                    paymentMethodOptions.find(
                      (opt) => opt.value === selectedRecord.payment_method
                    )?.label
                  }
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Date
                </Label>
                <p>{format(new Date(selectedRecord.date), 'PPP')}</p>
              </div>

              {selectedRecord.receipt_number && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Receipt Number
                  </Label>
                  <p>{selectedRecord.receipt_number}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Created
                </Label>
                <p>{format(new Date(selectedRecord.created_at), 'PPP p')}</p>
              </div>

              {selectedRecord.description && (
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Description
                  </Label>
                  <p className="mt-1">{selectedRecord.description}</p>
                </div>
              )}

              {selectedRecord.notes && (
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </Label>
                  <p className="mt-1">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {selectedRecord && (
              <Button
                onClick={() => {
                  setFormData({
                    amount: selectedRecord.amount,
                    extended_income_type: selectedRecord.extended_income_type,
                    occasion_name: selectedRecord.occasion_name || '',
                    source: selectedRecord.source || '',
                    payment_method: selectedRecord.payment_method,
                    date: selectedRecord.date,
                    description: selectedRecord.description || '',
                    notes: selectedRecord.notes || '',
                    receipt_number: selectedRecord.receipt_number || '',
                  });
                  setShowViewDialog(false);
                  setShowEditDialog(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Record
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { Income };
