import { supabase } from '@/utils/supabase';

export interface FinancePreferencesRow {
  id: string;
  organization_id: string;
  expenses_prefs: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function getFinancePreferences(orgId: string) {
  const { data, error } = await supabase
    .from('finance_preferences')
    .select('*')
    .eq('organization_id', orgId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as FinancePreferencesRow | null;
}

export async function upsertFinancePreferences(orgId: string, payload: { expenses_prefs: string }, userId?: string) {
  const existing = await getFinancePreferences(orgId);
  if (existing) {
    const { data, error } = await supabase
      .from('finance_preferences')
      .update({ expenses_prefs: payload.expenses_prefs })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as FinancePreferencesRow;
  } else {
    const { data, error } = await supabase
      .from('finance_preferences')
      .insert({ organization_id: orgId, expenses_prefs: payload.expenses_prefs, created_by: userId || null })
      .select()
      .single();
    if (error) throw error;
    return data as FinancePreferencesRow;
  }
}