import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface PledgePreferences {
  orgId: string;
  customPledgeTypes: string[];
  customFrequencies: string[];
  updatedAt: number;
}

export class ChurchHubPledgePrefsDB extends Dexie {
  pledgePrefs!: Table<PledgePreferences, string>;

  constructor() {
    super('ChurchHubPledgePrefsDB');
    this.version(1).stores({
      pledgePrefs: 'orgId',
    });
  }
}

export const pledgePrefsDb = new ChurchHubPledgePrefsDB();