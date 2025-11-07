import { extendedIncomeTypes } from '@/constants/finance/income';

// Align contribution type options with canonical ExtendedIncomeType values
export const contributionTypes = extendedIncomeTypes.map((t) => ({
  value: t,
  label: t,
}));

export const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_payment', label: 'Mobile Money Payment' },
  { value: 'online', label: 'Online Payment' },
];