import { randomUUID } from 'crypto';
import fs from 'fs';

const FIXED = {
  organization_id: '6bede681-52b5-4616-969b-02d303d84f53',
  branch_id: '57d31ccd-a28f-462d-ae11-39315bf350f9',
  created_by: '5717b8ef-94e5-49cf-9569-41783ac9cc8d'
};

const PAYMENT_METHODS = [
  'cash',
  'check',
  'cheque',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'mobile_payment',
  'online',
  'other'
];

const CATEGORY_PURPOSES = {
  Utilities: ['Electricity', 'Water', 'Internet', 'Waste Management'],
  Rent: ['Office Rent', 'Hall Rent', 'Storage Rent'],
  Salaries: ['Pastor Salary', 'Admin Salary', 'Cleaner Wages', 'Security Wages'],
  Maintenance: ['Building Repairs', 'Equipment Repair', 'Plumbing', 'Electrical Maintenance'],
  'Office Supplies': ['Stationery', 'Printing', 'Office Furniture'],
  Transport: ['Fuel', 'Vehicle Maintenance', 'Public Transport'],
  Outreach: ['Community Support', 'Evangelism Materials', 'Event Logistics'],
  Equipment: ['Sound Equipment', 'Media Equipment', 'IT Equipment'],
  Media: ['Streaming Services', 'Graphic Design', 'Advertising'],
  Miscellaneous: ['Bank Charges', 'Permits', 'Emergency Expense']
};

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randAmount(category) {
  const ranges = {
    Utilities: [100, 600],
    Rent: [500, 2000],
    Salaries: [800, 3000],
    Maintenance: [150, 1200],
    Transport: [50, 500],
    Outreach: [100, 800],
    Equipment: [300, 2500],
    Media: [100, 1000],
    'Office Supplies': [50, 400],
    Miscellaneous: [50, 700]
  };

  const [min, max] = ranges[category] || [50, 500];
  return (Math.random() * (max - min) + min).toFixed(2);
}

function randDate() {
  const start = new Date('2025-01-01');
  const end = new Date('2025-12-31');
  return new Date(start.getTime() + Math.random() * (end - start))
    .toISOString()
    .replace('T', ' ')
    .replace('Z', '+00');
}

const header = [
  'id',
  'organization_id',
  'branch_id',
  'amount',
  'description',
  'notes',
  'date',
  'created_by',
  'updated_at',
  'created_at',
  'vendor',
  'receipt_number',
  'payment_method',
  'approved_by',
  'approval_date',
  'is_deleted',
  'purpose',
  'category',
  'check_number'
].join(',');

const rows = [header];

let receipt = 5000;

for (let i = 0; i < 50; i++) {
  const category = rand(Object.keys(CATEGORY_PURPOSES));
  const purpose = rand(CATEGORY_PURPOSES[category]);
  const date = randDate();
  const paymentMethod = rand(PAYMENT_METHODS);

  rows.push([
    randomUUID(),
    FIXED.organization_id,
    FIXED.branch_id,
    randAmount(category),
    purpose,
    '',
    date,
    FIXED.created_by,
    date,
    date,
    '',
    `EXP-${receipt++}`,
    paymentMethod,
    '',
    '',
    false,
    purpose,
    category,
    paymentMethod === 'check' || paymentMethod === 'cheque' ? `CHK-${receipt}` : ''
  ].join(','));
}

fs.writeFileSync('dist/expense_seed.csv', rows.join('\n'));
console.log('✅ expense_seed.csv generated with category → purpose grouping');
