import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import {
  FinanceStatsCards,
  FinanceFilterBar,
  FinanceDataTable,
  FinanceReportGenerator,
  pledgeStatsConfig,
  type TableColumn,
  type TableAction
} from '@/components/finance';
import type { 
  PledgeRecord, 
  PledgePayment,
  PledgeFormData, 
  PledgePaymentFormData,
  FinanceFilter,
  PledgeType,
  PledgeStatus,
  PaymentFrequency,
  PaymentMethod
} from '@/types/finance';

// Mock data for pledges
const mockPledges: PledgeRecord[] = [
  {
    id: '1',
    organization_id: 'org1',
    branch_id: 'branch1',
    member_id: 'member1',
    member_name: 'John Smith',
    pledge_amount: 5000,
    amount_paid: 2500,
    amount_remaining: 2500,
    pledge_type: 'building_fund',
    campaign_name: 'New Sanctuary Project',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    payment_frequency: 'monthly',
    status: 'active',
    description: 'Monthly pledge for new sanctuary construction',
    created_by: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    organization_id: 'org1',
    branch_id: 'branch1',
    member_id: 'member2',
    member_name: 'Sarah Johnson',
    pledge_amount: 3000,
    amount_paid: 3000,
    amount_remaining: 0,
    pledge_type: 'missions',
    campaign_name: 'Global Missions 2024',
    start_date: '2024-01-01',
    end_date: '2024-06-30',
    payment_frequency: 'quarterly',
    status: 'fulfilled',
    description: 'Quarterly pledge for missions support',
    created_by: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-30T00:00:00Z',
  },
  {
    id: '3',
    organization_id: 'org1',
    branch_id: 'branch1',
    member_id: 'member3',
    member_name: 'Michael Davis',
    pledge_amount: 2400,
    amount_paid: 800,
    amount_remaining: 1600,
    pledge_type: 'annual_pledge',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    payment_frequency: 'monthly',
    status: 'overdue',
    description: 'Annual tithe pledge',
    created_by: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
];

// Mock data for pledge payments
const mockPledgePayments: PledgePayment[] = [
  {
    id: '1',
    pledge_id: '1',
    amount: 416.67,
    payment_date: '2024-01-15',
    payment_method: 'bank_transfer',
    notes: 'January payment',
    created_by: 'admin',
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    pledge_id: '1',
    amount: 416.67,
    payment_date: '2024-02-15',
    payment_method: 'bank_transfer',
    notes: 'February payment',
    created_by: 'admin',
    created_at: '2024-02-15T00:00:00Z',
  },
  {
    id: '3',
    pledge_id: '2',
    amount: 1500,
    payment_date: '2024-03-31',
    payment_method: 'check',
    notes: 'Q1 payment',
    created_by: 'admin',
    created_at: '2024-03-31T00:00:00Z',
  },
];

export function Pledges() {
  const [pledges] = useState<PledgeRecord[]>(mockPledges);
  const [pledgePayments] = useState<PledgePayment[]>(mockPledgePayments);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPledge, setSelectedPledge] = useState<PledgeRecord | null>(null);
  const [activeTab, setActiveTab] = useState('pledges');

  // Form data states
  const [formData, setFormData] = useState<PledgeFormData>({
    member_id: '',
    pledge_amount: 0,
    pledge_type: 'annual_pledge',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd'),
    payment_frequency: 'monthly',
    description: '',
  });

  const [paymentFormData, setPaymentFormData] = useState<PledgePaymentFormData>({
    pledge_id: '',
    amount: 0,
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'cash',
    notes: '',
  });

  // Filter state
  const [filters, setFilters] = useState<FinanceFilter>({
    date_filter: { type: 'preset', preset: 'this_month' },
  });

  // Filter options
  const filterOptions = {
    pledgeTypes: [
      { value: 'building_fund', label: 'Building Fund' },
      { value: 'missions', label: 'Missions' },
      { value: 'special_project', label: 'Special Project' },
      { value: 'annual_pledge', label: 'Annual Pledge' },
      { value: 'capital_campaign', label: 'Capital Campaign' },
      { value: 'other', label: 'Other' },
    ],
    statuses: [
      { value: 'active', label: 'Active' },
      { value: 'fulfilled', label: 'Fulfilled' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'overdue', label: 'Overdue' },
    ],
    paymentMethods: [
      { value: 'cash', label: 'Cash' },
      { value: 'check', label: 'Check' },
      { value: 'credit_card', label: 'Credit Card' },
      { value: 'debit_card', label: 'Debit Card' },
      { value: 'bank_transfer', label: 'Bank Transfer' },
      { value: 'mobile_payment', label: 'Mobile Payment' },
      { value: 'online', label: 'Online' },
      { value: 'other', label: 'Other' },
    ],
    paymentFrequencies: [
      { value: 'weekly', label: 'Weekly' },
      { value: 'bi_weekly', label: 'Bi-Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'annually', label: 'Annually' },
      { value: 'one_time', label: 'One Time' },
    ],
    members: [
      { value: 'member1', label: 'John Smith' },
      { value: 'member2', label: 'Sarah Johnson' },
      { value: 'member3', label: 'Michael Davis' },
    ],
  };

  // Filtered data
  const filteredPledges = useMemo(() => {
    return pledges.filter(() => {
      // Apply filters here based on the filters state
      return true; // Simplified for now
    });
  }, [pledges, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalPledges = filteredPledges.reduce((sum, pledge) => sum + pledge.pledge_amount, 0);
    const fulfilledAmount = filteredPledges
      .filter(pledge => pledge.status === 'fulfilled')
      .reduce((sum, pledge) => sum + pledge.pledge_amount, 0);
    const pendingAmount = totalPledges - fulfilledAmount;
    const fulfillmentRate = totalPledges > 0 ? (fulfilledAmount / totalPledges) * 100 : 0;

    return pledgeStatsConfig({
      totalPledges,
      recordCount: filteredPledges.length,
      fulfilledAmount,
      pendingAmount,
      fulfillmentRate,
    });
  }, [filteredPledges]);

  // Table columns for pledges
  const pledgeColumns: TableColumn[] = [
    {
      key: 'member_name',
      label: 'Member',
      sortable: true,
    },
    {
      key: 'pledge_type',
      label: 'Type',
      sortable: true,
      render: (value: PledgeType) => (
        <Badge variant="outline">
          {filterOptions.pledgeTypes.find(t => t.value === value)?.label || value}
        </Badge>
      ),
    },
    {
      key: 'campaign_name',
      label: 'Campaign',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'pledge_amount',
      label: 'Pledge Amount',
      sortable: true,
      render: (value: number) => `GHS${value.toLocaleString()}`,
    },
    {
      key: 'amount_paid',
      label: 'Amount Paid',
      sortable: true,
      render: (value: number) => `GHS${value.toLocaleString()}`,
    },
    {
      key: 'amount_remaining',
      label: 'Remaining',
      sortable: true,
      render: (value: number) => `GHS${value.toLocaleString()}`,
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (_, record: PledgeRecord) => {
        const progress = (record.amount_paid / record.pledge_amount) * 100;
        return (
          <div className="w-20">
            <Progress value={progress} className="h-2" />
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: PledgeStatus) => {
        const statusConfig = {
          active: { color: 'bg-blue-500', icon: Clock },
          fulfilled: { color: 'bg-green-500', icon: CheckCircle },
          overdue: { color: 'bg-red-500', icon: AlertCircle },
          cancelled: { color: 'bg-gray-500', icon: XCircle },
        };
        const config = statusConfig[value];
        const Icon = config.icon;
        return (
          <Badge variant="outline" className="gap-1">
            <Icon className="h-3 w-3" />
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'end_date',
      label: 'End Date',
      sortable: true,
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
  ];

  // Table actions for pledges
  const pledgeActions: TableAction[] = [
    {
      key: 'view',
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (record: PledgeRecord) => {
        setSelectedPledge(record);
        setShowViewDialog(true);
      },
    },
    {
      key: 'add_payment',
      label: 'Add Payment',
      icon: <DollarSign className="h-4 w-4" />,
      onClick: (record: PledgeRecord) => {
        setSelectedPledge(record);
        setPaymentFormData({
          ...paymentFormData,
          pledge_id: record.id,
          amount: Math.min(record.amount_remaining, record.pledge_amount / 12), // Suggest monthly amount
        });
        setShowPaymentDialog(true);
      },
      variant: 'default',
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (record: PledgeRecord) => {
        setSelectedPledge(record);
        setFormData({
          member_id: record.member_id,
          pledge_amount: record.pledge_amount,
          pledge_type: record.pledge_type,
          campaign_name: record.campaign_name,
          start_date: record.start_date,
          end_date: record.end_date,
          payment_frequency: record.payment_frequency,
          description: record.description || '',
        });
        setShowEditDialog(true);
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (record: PledgeRecord) => {
        // Handle delete
        console.log('Delete pledge:', record.id);
      },
      variant: 'destructive',
    },
  ];

  // Payment history for selected pledge
  const pledgePaymentHistory = useMemo(() => {
    if (!selectedPledge) return [];
    return pledgePayments.filter(payment => payment.pledge_id === selectedPledge.id);
  }, [selectedPledge, pledgePayments]);

  const handleAddPledge = () => {
    console.log('Add pledge:', formData);
    setShowAddDialog(false);
    // Reset form
    setFormData({
      member_id: '',
      pledge_amount: 0,
      pledge_type: 'annual_pledge',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd'),
      payment_frequency: 'monthly',
      description: '',
    });
  };

  const handleEditPledge = () => {
    console.log('Edit pledge:', selectedPledge?.id, formData);
    setShowEditDialog(false);
  };

  const handleAddPayment = () => {
    console.log('Add payment:', paymentFormData);
    setShowPaymentDialog(false);
    // Reset form
    setPaymentFormData({
      pledge_id: '',
      amount: 0,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'cash',
      notes: '',
    });
  };

  const handleGenerateReport = (config: any) => {
    console.log('Generate pledge report:', config);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pledge Management</h1>
          <p className="text-muted-foreground">
            Track pledges, manage payments, and monitor commitment progress
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Pledge
        </Button>
      </div>

      {/* Stats Cards */}
      <FinanceStatsCards stats={stats} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pledges">Pledges</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="pledges" className="space-y-4">
          {/* Filter Bar */}
          <FinanceFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            categoryOptions={filterOptions.pledgeTypes}
            memberOptions={filterOptions.members}
            searchPlaceholder="Search pledges..."
            onAddClick={() => setShowAddDialog(true)}
            addButtonLabel="New Pledge"
          />

          {/* Data Table */}
          <FinanceDataTable
            data={filteredPledges}
            columns={pledgeColumns}
            actions={pledgeActions}
          />

          {/* Report Generator */}
          <FinanceReportGenerator
            title="Pledge"
            data={filteredPledges}
            filters={filters}
            onGenerateReport={handleGenerateReport}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                All pledge payments across all members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pledgePayments.map((payment) => {
                  const pledge = pledges.find(p => p.id === payment.pledge_id);
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{pledge?.member_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {pledge?.campaign_name || pledge?.pledge_type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(payment.payment_date), 'MMM dd, yyyy')} • {payment.payment_method}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">GHS{payment.amount.toLocaleString()}</div>
                        {payment.notes && (
                          <div className="text-sm text-muted-foreground">{payment.notes}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Pledge Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Pledge</DialogTitle>
            <DialogDescription>
              Create a new pledge commitment for a member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="member">Member</Label>
              <Select
                value={formData.member_id}
                onValueChange={(value) => setFormData({ ...formData, member_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.members.map((member) => (
                    <SelectItem key={member.value} value={member.value}>
                      {member.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pledge_amount">Pledge Amount</Label>
              <Input
                id="pledge_amount"
                type="number"
                value={formData.pledge_amount}
                onChange={(e) => setFormData({ ...formData, pledge_amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="pledge_type">Pledge Type</Label>
              <Select
                value={formData.pledge_type}
                onValueChange={(value) => setFormData({ ...formData, pledge_type: value as PledgeType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.pledgeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_frequency">Payment Frequency</Label>
              <Select
                value={formData.payment_frequency}
                onValueChange={(value) => setFormData({ ...formData, payment_frequency: value as PaymentFrequency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.paymentFrequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="campaign_name">Campaign Name (Optional)</Label>
              <Input
                id="campaign_name"
                value={formData.campaign_name || ''}
                onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                placeholder="e.g., Building Fund 2024"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about the pledge..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPledge}>Add Pledge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedPledge?.member_name}'s pledge
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment_amount">Payment Amount</Label>
              <Input
                id="payment_amount"
                type="number"
                value={paymentFormData.amount}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              {selectedPledge && (
                <p className="text-sm text-muted-foreground mt-1">
                  Remaining: GHS{selectedPledge.amount_remaining.toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentFormData.payment_date}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={paymentFormData.payment_method}
                onValueChange={(value) => setPaymentFormData({ ...paymentFormData, payment_method: value as PaymentMethod })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_notes">Notes (Optional)</Label>
              <Textarea
                id="payment_notes"
                value={paymentFormData.notes || ''}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                placeholder="Additional notes about this payment..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment}>Add Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Pledge Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pledge Details</DialogTitle>
            <DialogDescription>
              View pledge information and payment history
            </DialogDescription>
          </DialogHeader>
          {selectedPledge && (
            <div className="space-y-6">
              {/* Pledge Overview */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Member</Label>
                    <p className="text-lg font-medium">{selectedPledge.member_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Pledge Type</Label>
                    <p>{filterOptions.pledgeTypes.find(t => t.value === selectedPledge.pledge_type)?.label}</p>
                  </div>
                  {selectedPledge.campaign_name && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Campaign</Label>
                      <p>{selectedPledge.campaign_name}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Payment Frequency</Label>
                    <p>{filterOptions.paymentFrequencies.find(f => f.value === selectedPledge.payment_frequency)?.label}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Pledge Amount</Label>
                    <p className="text-2xl font-bold">GHS{selectedPledge.pledge_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Amount Paid</Label>
                    <p className="text-lg font-medium text-green-600">GHS{selectedPledge.amount_paid.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Remaining</Label>
                    <p className="text-lg font-medium text-orange-600">GHS{selectedPledge.amount_remaining.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Progress</Label>
                    <div className="space-y-2">
                      <Progress value={(selectedPledge.amount_paid / selectedPledge.pledge_amount) * 100} />
                      <p className="text-sm text-muted-foreground">
                        {Math.round((selectedPledge.amount_paid / selectedPledge.pledge_amount) * 100)}% complete
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Payment History</Label>
                <div className="mt-2 space-y-2">
                  {pledgePaymentHistory.length > 0 ? (
                    pledgePaymentHistory.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">GHS{payment.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(payment.payment_date), 'MMM dd, yyyy')} • {payment.payment_method}
                          </p>
                          {payment.notes && (
                            <p className="text-sm text-muted-foreground">{payment.notes}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No payments recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {selectedPledge && selectedPledge.amount_remaining > 0 && (
              <Button onClick={() => {
                setPaymentFormData({
                  ...paymentFormData,
                  pledge_id: selectedPledge.id,
                  amount: Math.min(selectedPledge.amount_remaining, selectedPledge.pledge_amount / 12),
                });
                setShowViewDialog(false);
                setShowPaymentDialog(true);
              }}>
                <DollarSign className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Pledge Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pledge</DialogTitle>
            <DialogDescription>
              Update pledge information for {selectedPledge?.member_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_member">Member</Label>
              <Select
                value={formData.member_id}
                onValueChange={(value) => setFormData({ ...formData, member_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.members.map((member) => (
                    <SelectItem key={member.value} value={member.value}>
                      {member.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_pledge_amount">Pledge Amount</Label>
              <Input
                id="edit_pledge_amount"
                type="number"
                value={formData.pledge_amount}
                onChange={(e) => setFormData({ ...formData, pledge_amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="edit_pledge_type">Pledge Type</Label>
              <Select
                value={formData.pledge_type}
                onValueChange={(value) => setFormData({ ...formData, pledge_type: value as PledgeType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.pledgeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_payment_frequency">Payment Frequency</Label>
              <Select
                value={formData.payment_frequency}
                onValueChange={(value) => setFormData({ ...formData, payment_frequency: value as PaymentFrequency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.paymentFrequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_start_date">Start Date</Label>
              <Input
                id="edit_start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_end_date">End Date</Label>
              <Input
                id="edit_end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit_campaign_name">Campaign Name (Optional)</Label>
              <Input
                id="edit_campaign_name"
                value={formData.campaign_name || ''}
                onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                placeholder="e.g., Building Fund 2024"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about the pledge..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPledge}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}