import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import confetti from 'canvas-confetti';

function isWishActive(dobIso: string) {
  const today = new Date();
  const dob = new Date(dobIso);
  const start = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 3);
  return today >= start && today <= end;
}

export default function BirthdayWish() {
  const { memberId } = useParams();
  const { data } = useQuery({
    queryKey: ['present-birthday', memberId],
    enabled: !!memberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members_summary')
        .select(
          'id, full_name, date_of_birth, profile_image_url, branch_name, organization_id'
        )
        .eq('id', memberId!)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    staleTime: 60 * 1000,
  });

  const { data: org } = useQuery({
    queryKey: ['present-birthday-org', (data as any)?.organization_id],
    enabled: !!(data as any)?.organization_id,
    queryFn: async () => {
      const { data: orgData, error: orgErr } = await supabase
        .from('organizations')
        .select('id, name, logo')
        .eq('id', (data as any).organization_id)
        .maybeSingle();
      if (orgErr) throw orgErr;
      return orgData || null;
    },
    staleTime: 60 * 1000,
  });

  

  useEffect(() => {
    const isActive = !!(data && data.date_of_birth && isWishActive(data.date_of_birth as string));
    if (!isActive) return;
    const isDark = document.documentElement.classList.contains('dark');
    const colors = isDark
      ? ['#fde68a', '#fecaca', '#6ee7b7', '#93c5fd', '#d8b4fe']
      : ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#a855f7'];
    const end = Date.now() + 1500;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [data]);

  if (
    !data ||
    !data.date_of_birth ||
    !isWishActive(data.date_of_birth as string)
  )
    return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 dark:from-pink-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="max-w-md w-full bg-background rounded-2xl shadow-lg p-8 text-center">
        {org && (
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {org.logo ? (
              <img
                src={org.logo as string}
                alt={org.name as string}
                className="h-8 w-8 rounded object-cover"
              />
            ) : null}
            <span>From {org.name}</span>
          </div>
        )}
        <div className="mx-auto h-24 w-24 rounded-full overflow-hidden bg-muted mb-4">
          {data.profile_image_url ? (
            <img
              src={data.profile_image_url}
              alt={data.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-3xl">
              🎉
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold">
          Happy Birthday, {data.full_name} 🎂
        </h1>
        <p className="text-muted-foreground mt-2">
          Wishing you joy, blessings, and a wonderful year ahead.
        </p>
        {data.branch_name && (
          <p className="text-xs text-muted-foreground mt-2">
            {data.branch_name}
          </p>
        )}
      </div>
    </div>
  );
}
