import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { pledgePrefsDb, type PledgePreferences } from '@/db/pledgePrefsDb';
import { useOrganization } from '@/contexts/OrganizationContext';

// Default pledge types
const DEFAULT_TYPES = ['Building Fund', 'Missions', 'Special Project', 'Annual Pledge', 'Capital Campaign', 'Other'];
const DEFAULT_FREQUENCIES = ['One time', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Annually'];

export function usePledgePreferences() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  // Read-only live query of preferences
  const prefs = useLiveQuery(async () => {
    if (!orgId) return null;
    return await pledgePrefsDb.pledgePrefs.get(orgId);
  }, [orgId]);

  // Ensure record exists outside of liveQuery; no writes in liveQuery context
  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const existing = await pledgePrefsDb.pledgePrefs.get(orgId);
      if (!existing) {
        const p: PledgePreferences = {
          orgId,
          customPledgeTypes: [],
          customFrequencies: [],
          updatedAt: Date.now(),
        };
        await pledgePrefsDb.pledgePrefs.put(p);
      }
    })();
  }, [orgId]);

  const addType = async (label: string) => {
    if (!orgId || !label.trim()) return;
    const p = await pledgePrefsDb.pledgePrefs.get(orgId);
    const existing = p?.customPledgeTypes || [];
    if (existing.includes(label)) return;
    await pledgePrefsDb.pledgePrefs.put({
      orgId,
      customPledgeTypes: [...existing, label],
      customFrequencies: p?.customFrequencies || [],
      updatedAt: Date.now(),
    });
  };

  const removeType = async (label: string) => {
    if (!orgId) return;
    const p = await pledgePrefsDb.pledgePrefs.get(orgId);
    const existing = p?.customPledgeTypes || [];
    await pledgePrefsDb.pledgePrefs.put({
      orgId,
      customPledgeTypes: existing.filter((x) => x !== label),
      customFrequencies: p?.customFrequencies || [],
      updatedAt: Date.now(),
    });
  };

  const addFrequency = async (label: string) => {
    if (!orgId || !label.trim()) return;
    const p = await pledgePrefsDb.pledgePrefs.get(orgId);
    const existing = p?.customFrequencies || [];
    if (existing.includes(label)) return;
    await pledgePrefsDb.pledgePrefs.put({
      orgId,
      customPledgeTypes: p?.customPledgeTypes || [],
      customFrequencies: [...existing, label],
      updatedAt: Date.now(),
    });
  };

  const removeFrequency = async (label: string) => {
    if (!orgId) return;
    const p = await pledgePrefsDb.pledgePrefs.get(orgId);
    const existing = p?.customFrequencies || [];
    await pledgePrefsDb.pledgePrefs.put({
      orgId,
      customPledgeTypes: p?.customPledgeTypes || [],
      customFrequencies: existing.filter((x) => x !== label),
      updatedAt: Date.now(),
    });
  };

  const typeOptions = [...DEFAULT_TYPES, ...((prefs?.customPledgeTypes) || [])];
  const frequencyOptions = [...DEFAULT_FREQUENCIES, ...((prefs?.customFrequencies) || [])];

  return {
    prefs,
    typeOptions,
    frequencyOptions,
    addType,
    removeType,
    addFrequency,
    removeFrequency,
  };
}