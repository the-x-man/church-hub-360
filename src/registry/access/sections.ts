export type SectionKey =
  | 'branches'
  | 'people'
  | 'finance'
  | 'events'
  | 'announcements'
  | 'assets'
  | 'user_management'
  | 'settings';

export type PeopleChildKey = 'attendance' | 'tags_groups' | 'membership' | 'form_builder' | 'birthdays';
export type FinanceChildKey = 'insights' | 'income' | 'expenses' | 'contributions' | 'pledges';

export const PEOPLE_CHILDREN: PeopleChildKey[] = [
  'attendance',
  'tags_groups',
  'membership',
  'form_builder',
  'birthdays',
];

export const FINANCE_CHILDREN: FinanceChildKey[] = [
  'insights',
  'income',
  'expenses',
  'contributions',
  'pledges',
];