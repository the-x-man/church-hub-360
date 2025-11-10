import { extendedIncomeTypes } from '@/constants/finance/income';
import type { PaymentMethod } from '@/types/finance';

// Align contribution type options with canonical ExtendedIncomeType values
export const contributionTypes = extendedIncomeTypes.map((t) => ({
  value: t,
  label: t,
}));

 // Payment method options
export const paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Cash' },
    { value: 'mobile_payment', label: 'Mobile Money' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'online', label: 'Online' },
    { value: 'other', label: 'Other' },
  ];