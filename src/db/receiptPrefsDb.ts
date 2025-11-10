import Dexie, { type Table } from 'dexie';

// Keys available for customizable receipt fields
export type ReceiptFieldKey =
  | 'income_type'
  | 'category'
  | 'source'
  | 'occasion_name'
  | 'date'
  | 'payment_method'
  | 'envelope_number'
  | 'tax_deductible'
  | 'amount'
  | 'receipt_number';

export interface ReceiptFieldPreference {
  key: ReceiptFieldKey;
  label: string;
  enabled: boolean;
}

export interface ReceiptPreferences {
  orgId: string;
  updatedAt: number; // epoch millis
  fields: ReceiptFieldPreference[];
  number: {
    pattern: string; // e.g., "RCPT-{ORG4}-{YYMMDD}-{RAND3}"
    seq: number; // local sequence counter
  };
  footer: {
    enabled: boolean;
    message: string;
  };
}

class ChurchHubPrefsDB extends Dexie {
  receiptPrefs!: Table<ReceiptPreferences, string>;

  constructor() {
    super('ch360-prefs');
    this.version(1).stores({
      // unique by orgId for fast lookups
      receiptPrefs: '&orgId',
    });
    // v2: add footer preferences
    this.version(2)
      .stores({
        receiptPrefs: '&orgId',
      })
      .upgrade(async (tx) => {
        const table = tx.table('receiptPrefs');
        await table.toCollection().modify((obj: any) => {
          if (!obj.footer) {
            obj.footer = { enabled: true, message: DEFAULT_FOOTER_MESSAGE };
          }
        });
      });
  }
}

export const receiptPrefsDb = new ChurchHubPrefsDB();

export const DEFAULT_FIELD_PREFS: ReceiptFieldPreference[] = [
  { key: 'income_type', label: 'Income Type', enabled: true },
  { key: 'category', label: 'Category', enabled: true },
  { key: 'source', label: 'Source', enabled: true },
  { key: 'occasion_name', label: 'Occasion', enabled: true },
  { key: 'date', label: 'Date', enabled: true },
  { key: 'payment_method', label: 'Payment Method', enabled: true },
  { key: 'envelope_number', label: 'Envelope #', enabled: true },
  { key: 'tax_deductible', label: 'Tax Deductible', enabled: true },
  { key: 'amount', label: 'Amount', enabled: true },
  { key: 'receipt_number', label: 'Receipt #', enabled: true },
];

export const DEFAULT_PATTERN = 'RCPT-{ORG4}-{YYMMDD}-{RAND3}';
export const DEFAULT_FOOTER_MESSAGE = 'Thank you for your support.';

export function defaultReceiptPreferences(orgId: string): ReceiptPreferences {
  return {
    orgId,
    updatedAt: Date.now(),
    fields: DEFAULT_FIELD_PREFS,
    number: {
      pattern: DEFAULT_PATTERN,
      seq: 0,
    },
    footer: {
      enabled: true,
      message: DEFAULT_FOOTER_MESSAGE,
    },
  };
}