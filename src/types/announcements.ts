export interface Announcement {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  is_deleted: boolean;
  created_by?: string | null;
  last_updated_by?: string | null;
  created_at: string;
  updated_at: string;
  slides?: string | null;
}

export interface AnnouncementWithMeta extends Announcement {
  slides_count?: number;
  created_by_name?: string | null;
}

// JSON-stored slide shape used within announcements.slides (stringified)
export interface SlideDraft {
  id: string;
  position: number;
  title?: string;
  content_html?: string;
  layout?: string;
  template_variant?: string;
  bg_color?: string;
  fg_color?: string;
  font_size?: number;
}

export interface CreateAnnouncementInput {
  title: string;
  description: string;
  slides?: string; // stringified JSON array of SlideDraft
}

export interface UpdateAnnouncementInput {
  title?: string;
  description?: string;
  slides?: string; // stringified JSON array of SlideDraft
}

// Deprecated: legacy per-row slide types were replaced by announcements.slides JSON
export type CreateSlideInput = never;
export type UpdateSlideInput = never;

