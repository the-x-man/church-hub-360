import { useCallback, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  receiptPrefsDb,
  type ReceiptPreferences,
  type ReceiptFieldPreference,
  defaultReceiptPreferences,
  DEFAULT_FIELD_PREFS,
  DEFAULT_PATTERN,
  type ReceiptFieldKey,
} from '@/db/receiptPrefsDb';

export function useReceiptPreferences(orgId?: string) {
  const prefs = useLiveQuery(async () => {
    if (!orgId) return undefined;
    return await receiptPrefsDb.receiptPrefs.get(orgId);
  }, [orgId]);

  // Initialize defaults OUTSIDE of liveQuery to avoid ReadOnlyError
  const initRef = useRef(false);
  useEffect(() => {
    if (!orgId) return;
    if (prefs === undefined && !initRef.current) {
      initRef.current = true;
      (async () => {
        const found = await receiptPrefsDb.receiptPrefs.get(orgId);
        if (!found) {
          await receiptPrefsDb.receiptPrefs.put(defaultReceiptPreferences(orgId));
        }
        initRef.current = false;
      })();
    }
  }, [orgId, prefs]);

  const isLoading = !orgId || !prefs;

  const save = useCallback(
    async (next: ReceiptPreferences) => {
      await receiptPrefsDb.receiptPrefs.put({ ...next, updatedAt: Date.now() });
    },
    []
  );

  const reset = useCallback(async () => {
    if (!orgId) return;
    await receiptPrefsDb.receiptPrefs.put(defaultReceiptPreferences(orgId));
  }, [orgId]);

  const updateField = useCallback(
    async (key: ReceiptFieldKey, update: Partial<ReceiptFieldPreference>) => {
      if (!prefs) return;
      const fields = (prefs.fields ?? DEFAULT_FIELD_PREFS).map((f) =>
        f.key === key ? { ...f, ...update } : f
      );
      await save({ ...prefs, fields });
    },
    [prefs, save]
  );

  const setPattern = useCallback(
    async (pattern: string) => {
      if (!prefs) return;
      await save({ ...prefs, number: { ...prefs.number, pattern } });
    },
    [prefs, save]
  );

  const bumpSeq = useCallback(async () => {
    if (!prefs) return 0;
    const next = (prefs.number?.seq ?? 0) + 1;
    await save({ ...prefs, number: { ...prefs.number, seq: next } });
    return next;
  }, [prefs, save]);

  const setFooterEnabled = useCallback(
    async (enabled: boolean) => {
      if (!prefs) return;
      await save({ ...prefs, footer: { ...prefs.footer, enabled } });
    },
    [prefs, save]
  );

  const setFooterMessage = useCallback(
    async (message: string) => {
      if (!prefs) return;
      await save({ ...prefs, footer: { ...prefs.footer, message } });
    },
    [prefs, save]
  );

  return { prefs, isLoading, save, reset, updateField, setPattern, bumpSeq, setFooterEnabled, setFooterMessage, DEFAULT_FIELD_PREFS, DEFAULT_PATTERN };
}

export type { ReceiptPreferences, ReceiptFieldPreference };