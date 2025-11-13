import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PresentationView from '@/components/announcements/slides/PresentationView';
import { useAnnouncementPublic } from '@/hooks/announcements/useAnnouncements';
import type { SlideDraft } from '@/types/announcements';

export default function AnnouncementPresent() {
  const { announcementId = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useAnnouncementPublic(announcementId);

  const slides: SlideDraft[] = React.useMemo(() => {
    if (!data?.slides) return [];
    try {
      const arr = JSON.parse(data.slides || '[]');
      return Array.isArray(arr) ? (arr as SlideDraft[]) : [];
    } catch {
      return [];
    }
  }, [data?.slides]);

  if (isLoading) {
    return <div className="fixed inset-0 flex items-center justify-center">Loading…</div>;
  }
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-destructive">
        Failed to load announcement
      </div>
    );
  }

  return (
    <PresentationView
      slides={slides}
      onExit={() => navigate('/announcements')}
      hideExit
      hideAutoPlay
    />
  );
}