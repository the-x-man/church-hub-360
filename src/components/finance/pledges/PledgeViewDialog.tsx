import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pagination } from '@/components/shared/Pagination';
import { PledgePaymentDialog } from './PledgePaymentDialog';
import { usePledgePayments } from '@/hooks/finance/pledges';
import type { PledgeRecord } from '@/types/finance';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PledgeViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pledge: PledgeRecord | null;
}

export function PledgeViewDialog({
  open,
  onOpenChange,
  pledge,
}: PledgeViewDialogProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const paymentsQuery = usePledgePayments(pledge?.id || null, {
    page,
    pageSize,
  });
  const payments = paymentsQuery.data?.data || [];
  const totalPages = paymentsQuery.data?.totalPages || 1;
  const totalItems = paymentsQuery.data?.totalCount || 0;
  const loading = paymentsQuery.isLoading;

  const progressPct =
    pledge && pledge.pledge_amount > 0
      ? (pledge.amount_paid / pledge.pledge_amount) * 100
      : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setShowPaymentDialog(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>Pledge Details</DialogTitle>
          <DialogDescription>
            View pledge information and payment history
          </DialogDescription>
        </DialogHeader>

        {pledge && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Source
                  </Label>
                  <p className="text-lg font-medium">
                    {pledge.contributor_name || pledge.member_name || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Pledge Type
                  </Label>
                  <p className="capitalize">
                    {String(pledge.pledge_type).replace('_', ' ')}
                  </p>
                </div>
                {pledge.campaign_name && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Campaign
                    </Label>
                    <p>{pledge.campaign_name}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Payment Frequency
                  </Label>
                  <p className="capitalize">
                    {String(pledge.payment_frequency).replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Pledge Amount
                  </Label>
                  <p className="text-2xl font-bold">
                    GHS{pledge.pledge_amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Amount Paid
                  </Label>
                  <p className="text-lg font-medium text-green-600">
                    GHS{pledge.amount_paid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Remaining
                  </Label>
                  <p className="text-lg font-medium text-orange-600">
                    GHS{pledge.amount_remaining.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Progress
                  </Label>
                  <div className="space-y-2">
                    <Progress value={progressPct} />
                    <p className="text-sm text-muted-foreground">
                      {Math.round(progressPct)}% complete
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {pledge.created_by_user && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Record Created By
                </Label>
                <p>{`${pledge.created_by_user.first_name} ${pledge.created_by_user.last_name}`}</p>
              </div>
            )}

            <ScrollArea className="h-[calc(95vh-550px)] p-4  border-b">
              <div className="space-y-2 overflow-auto">
                <Label className="text-sm font-medium text-muted-foreground">
                  Payment History
                </Label>
                <div className="mt-2 space-y-2">
                  {loading ? (
                    <p className="text-muted-foreground">Loading payments...</p>
                  ) : payments.length > 0 ? (
                    payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between px-3 py-2 border rounded"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            GHS{payment.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(payment.payment_date),
                              'MMM dd, yyyy hh:mm:aa'
                            )}{' '}
                            •{' '}
                            {payment.payment_method
                              .replace('_', ' ')
                              .toLocaleUpperCase()}
                          </p>
                          {payment.notes && (
                            <p className="text-sm text-muted-foreground">
                              {payment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      No payments recorded yet.
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
              itemName="payments"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {pledge && pledge.amount_remaining > 0 && (
            <Button onClick={() => setShowPaymentDialog(true)}>
              Add Payment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {pledge && (
        <PledgePaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          pledge={pledge}
          onSuccess={() => {
            // Refresh payments after successful add
            setPage(1);
          }}
        />
      )}
    </Dialog>
  );
}
