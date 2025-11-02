-- Create attendance_sessions table
-- Represents specific instances of attendance marking derived from occasions

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  occasion_id uuid NOT NULL,
  name text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_open boolean DEFAULT false NOT NULL,
  allow_public_marking boolean DEFAULT false NOT NULL,
  proximity_required boolean DEFAULT false NOT NULL,
  location jsonb,
  allowed_tags uuid[],
  marking_modes jsonb DEFAULT '{"email": true, "phone": true, "membership_id": true, "manual": true, "public_link": false}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL,
  is_deleted boolean DEFAULT false NOT NULL,
  last_updated_by uuid,

  -- Foreign key constraints
  constraint attendance_sessions_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint attendance_sessions_occasion_id_fkey foreign KEY (occasion_id) references attendance_occasions (id) on delete CASCADE,
  constraint attendance_sessions_created_by_fkey foreign KEY (created_by) references profiles (id) on delete RESTRICT,
  constraint attendance_sessions_last_updated_by_fkey foreign KEY (last_updated_by) references profiles (id) on delete set null,

  -- Check constraints
  constraint attendance_sessions_end_time_after_start_time check (end_time > start_time),
  constraint attendance_sessions_valid_location check (
    location IS NULL OR (
      location ? 'lat' AND 
      location ? 'lng' AND 
      (location->>'lat')::numeric BETWEEN -90 AND 90 AND
      (location->>'lng')::numeric BETWEEN -180 AND 180 AND
      (location ? 'radius' IS FALSE OR (location->>'radius')::numeric > 0)
    )
  )
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_organization_id ON attendance_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_occasion_id ON attendance_sessions(occasion_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_start_time ON attendance_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_end_time ON attendance_sessions(end_time);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_is_open ON attendance_sessions(is_open);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_created_by ON attendance_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_is_deleted ON attendance_sessions(is_deleted);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_org_occasion ON attendance_sessions(organization_id, occasion_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_org_active ON attendance_sessions(organization_id, is_open) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_time_range ON attendance_sessions(start_time, end_time) WHERE is_deleted = false;

-- Create updated_at trigger
CREATE TRIGGER update_attendance_sessions_updated_at
    BEFORE UPDATE ON attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE attendance_sessions IS 'Specific instances of attendance marking events derived from attendance occasions';
COMMENT ON COLUMN attendance_sessions.occasion_id IS 'Reference to the parent attendance occasion';
COMMENT ON COLUMN attendance_sessions.name IS 'Optional override name for the session (e.g., "Sunday Service - Youth Branch")';
COMMENT ON COLUMN attendance_sessions.start_time IS 'When the attendance session starts';
COMMENT ON COLUMN attendance_sessions.end_time IS 'When the attendance session ends';
COMMENT ON COLUMN attendance_sessions.is_open IS 'Whether attendance can currently be marked for this session';
COMMENT ON COLUMN attendance_sessions.allow_public_marking IS 'Whether members can self-mark attendance via public link';
COMMENT ON COLUMN attendance_sessions.proximity_required IS 'Whether location validation is required for attendance marking';
COMMENT ON COLUMN attendance_sessions.location IS 'Optional location data for proximity checking: {lat, lng, radius}';
COMMENT ON COLUMN attendance_sessions.allowed_tags IS 'Array of tag IDs that restrict who can attend this session';
COMMENT ON COLUMN attendance_sessions.marking_modes IS 'JSON object defining which marking methods are enabled';