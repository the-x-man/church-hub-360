import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/shared/DatePicker';
import type { PaymentMethod, PledgePayment } from '@/types/finance';
import { paymentMethodOptions } from '../constants';
import { useUpdatePayment } from '@/hooks/finance/payments';

interface PaymentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PledgePayment | null;
  onSuccess?: () => void;
}

export function PaymentEditDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: PaymentEditDialogProps) {
  const updatePayment = useUpdatePayment();

  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [checkNumber, setCheckNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (open && payment) {
      setAmount(payment.amount || 0);
      setPaymentDate(payment.payment_date || '');
      setPaymentMethod(payment.payment_method || 'cash');
      setCheckNumber(payment.check_number || '');
      setNotes(payment.notes || '');
    }
  }, [open, payment]);

  const canSubmit =
    !!payment &&
    amount > 0 &&
    !!paymentDate &&
    (paymentMethod !== 'cheque' || (checkNumber || '').trim().length > 0);
  const isSubmitting = updatePayment.isPending;

  const handleSubmit = async () => {
    if (!payment) return;
    await updatePayment.mutateAsync({
      id: payment.id,
      updates: {
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        check_number: checkNumber || undefined,
        notes: notes || undefined,
      },
    });
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>Update payment details</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment_amount">Payment Amount</Label>
            <Input
              id="payment_amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <DatePicker
              label="Payment Date"
              value={paymentDate}
              onChange={setPaymentDate}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'cheque' && (
            <div className="space-y-2">
              <Label htmlFor="check_number">Cheque Number</Label>
              <Input
                id="check_number"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                placeholder="Enter cheque number"
              />
            </div>
          )}

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
