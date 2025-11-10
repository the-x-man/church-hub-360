import { useState } from 'react';
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
import { useCreatePledgePayment } from '@/hooks/finance/pledges';
import type { PaymentMethod, PledgeRecord } from '@/types/finance';
import { paymentMethodOptions } from '../constants';

interface PledgePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pledge: PledgeRecord | null;
  onSuccess?: () => void;
}

export function PledgePaymentDialog({
  open,
  onOpenChange,
  pledge,
  onSuccess,
}: PledgePaymentDialogProps) {
  const createPayment = useCreatePledgePayment();

  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState<string>('');

  const canSubmit = !!pledge && amount > 0 && !!paymentDate;
  const isSubmitting = createPayment.isPending;

  const handleSubmit = async () => {
    if (!pledge) return;
    await createPayment.mutateAsync({
      pledge_id: pledge.id,
      amount,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      notes: notes || undefined,
    });
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            {pledge
              ? `Record a payment for ${pledge.member_name}'s pledge`
              : 'Select a pledge'}
          </DialogDescription>
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

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="payment_notes">Notes</Label>
            <Textarea
              id="payment_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this payment..."
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
            Add Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
