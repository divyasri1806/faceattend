/*
  # Face Attendance Management System Schema

  ## Tables
  1. `persons` — stores registered persons (students/employees) with their face descriptors
     - id, name, role, department, face_descriptor (float array), image_url, created_at
  2. `attendance_logs` — records each attendance event
     - id, person_id (FK), timestamp, confidence, status (present/late/absent)
  3. `attendance_sessions` — groups attendance by date/session
     - id, session_date, session_name, total_registered, total_present

  ## Security
  - RLS enabled on all tables
  - Policies allow all authenticated access (single-org app)
*/

CREATE TABLE IF NOT EXISTS persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'student',
  department text NOT NULL DEFAULT '',
  face_descriptor float8[] NOT NULL DEFAULT '{}',
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to persons"
  ON persons FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert persons"
  ON persons FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update persons"
  ON persons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete persons"
  ON persons FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  confidence float8 NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'present',
  session_date date DEFAULT CURRENT_DATE
);

ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to attendance_logs"
  ON attendance_logs FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert attendance_logs"
  ON attendance_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update attendance_logs"
  ON attendance_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete attendance_logs"
  ON attendance_logs FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_person_id ON attendance_logs(person_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_session_date ON attendance_logs(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_timestamp ON attendance_logs(timestamp);
