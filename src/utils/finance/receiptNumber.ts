import { format } from 'date-fns';
import { supabase } from '@/utils/supabase';

interface PatternContext {
  orgId?: string;
  orgName?: string;
  date?: Date;
  seq?: number;
}

const sanitizeOrg = (name?: string) =>
  (name || 'ORG').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

const orgInitials = (name?: string) => {
  if (!name) return 'ORG';
  const parts = name.split(/[\s\-_.]+/g).filter(Boolean);
  const initials = parts.map((p) => p[0] ?? '').join('');
  const cleaned = initials.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return cleaned || sanitizeOrg(name).slice(0, 4);
};

const rand = (n: number) => Math.floor(Math.random() * Math.pow(10, n)).toString().padStart(n, '0');

export function compilePattern(pattern: string, ctx: PatternContext): string {
  const now = ctx.date ?? new Date();
  const org = sanitizeOrg(ctx.orgName);
  const orgI = orgInitials(ctx.orgName);
  const seq = ctx.seq ?? 0;

  let out = pattern;

  out = out.replace(/{ORG}/g, org);
  out = out.replace(/{ORG4}/g, org.slice(0, 4));
  out = out.replace(/{ORGI}/g, orgI);
  out = out.replace(/{ORGI4}/g, orgI.slice(0, 4));
  out = out.replace(/\{ORGI(\d+)\}/g, (_m, n: string) => orgI.slice(0, Number(n)));
  out = out.replace(/{YYYY}/g, format(now, 'yyyy'));
  out = out.replace(/{YY}/g, format(now, 'yy'));
  out = out.replace(/{MM}/g, format(now, 'MM'));
  out = out.replace(/{DD}/g, format(now, 'dd'));
  out = out.replace(/{YYMMDD}/g, format(now, 'yyMMdd'));
  out = out.replace(/{HHmm}/g, format(now, 'HHmm'));
  out = out.replace(/{SEQ}/g, String(seq));

  // Random segments: {RAND3}, {RAND4}, {RAND6}
  out = out.replace(/{RAND3}/g, rand(3));
  out = out.replace(/{RAND4}/g, rand(4));
  out = out.replace(/{RAND6}/g, rand(6));

  return out;
}

export async function ensureUniqueReceiptNumber(orgId: string | undefined, candidate: string): Promise<string> {
  if (!orgId) return candidate;
  let attempt = candidate;
  for (let i = 0; i < 3; i++) {
    const { data, error } = await supabase
      .from('income')
      .select('id')
      .eq('organization_id', orgId)
      .eq('receipt_number', attempt)
      .limit(1);
    if (error) break;
    if (!data || data.length === 0) return attempt;
    attempt = `${candidate}-${rand(3)}`;
  }
  return attempt;
}

export async function generateReceiptNumberByPattern(opts: {
  orgId?: string;
  orgName?: string;
  pattern: string;
  seq?: number;
}): Promise<string> {
  const base = compilePattern(opts.pattern, {
    orgId: opts.orgId,
    orgName: opts.orgName,
    date: new Date(),
    seq: opts.seq ?? 0,
  });
  return ensureUniqueReceiptNumber(opts.orgId, base);
}