-- Create attendance_records table
-- Logs individual attendance marks for sessions

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL,
  member_id uuid NOT NULL,
  marked_by uuid,
  marked_by_mode text NOT NULL,
  marked_at timestamptz NOT NULL DEFAULT NOW(),
  location jsonb,
  notes text,
  is_valid boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  -- Foreign key constraints
  CONSTRAINT attendance_records_session_id_fkey FOREIGN KEY (session_id) REFERENCES attendance_sessions (id) ON DELETE CASCADE,
  CONSTRAINT attendance_records_member_id_fkey FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE RESTRICT,
  CONSTRAINT attendance_records_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES profiles (id) ON DELETE SET NULL,

  -- Check constraints
  CONSTRAINT attendance_records_marked_by_mode_check CHECK (marked_by_mode IN ('email','phone','membership_id','manual')),
  CONSTRAINT attendance_records_valid_location CHECK (
    location IS NULL OR (
      location ? 'lat' AND 
      location ? 'lng' AND 
      (location->>'lat')::numeric BETWEEN -90 AND 90 AND
      (location->>'lng')::numeric BETWEEN -180 AND 180 AND
      (location ? 'accuracy' IS FALSE OR (location->>'accuracy')::numeric > 0)
    )
  )
);

-- Prevent duplicate marks for same member within a session
CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_session_member_unique ON attendance_records(session_id, member_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_member_id ON attendance_records(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_marked_at ON attendance_records(marked_at);
CREATE INDEX IF NOT EXISTS idx_attendance_records_marked_by ON attendance_records(marked_by);
CREATE INDEX IF NOT EXISTS idx_attendance_records_is_valid ON attendance_records(is_valid) WHERE is_valid = true;

-- updated_at trigger
CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (policies should be added separately)
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Comments for clarity
COMMENT ON TABLE attendance_records IS 'Log of individual attendance marks for sessions';
COMMENT ON COLUMN attendance_records.session_id IS 'Reference to the attendance session';
COMMENT ON COLUMN attendance_records.member_id IS 'Member who was marked present';
COMMENT ON COLUMN attendance_records.marked_by IS 'User who performed the marking';
COMMENT ON COLUMN attendance_records.marked_by_mode IS 'Mode used to mark attendance (email/phone/membership_id/manual)';
COMMENT ON COLUMN attendance_records.location IS 'Optional location at time of marking {lat,lng,accuracy}';
COMMENT ON COLUMN attendance_records.notes IS 'Optional notes or remarks';
COMMENT ON COLUMN attendance_records.is_valid IS 'Whether the record is considered valid';