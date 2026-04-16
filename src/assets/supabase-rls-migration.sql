-- =============================================================================
-- RLS Migration: Device-scoped row-level security
-- Replaces the permissive (USING true) policies with device_id-based isolation.
--
-- Prerequisites:
--   Each table must already have a "device_id" TEXT column.
--   If not, run the ALTER TABLE statements in the "Add columns" section first.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Add device_id columns (idempotent — skipped if they already exist)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'iagentek_simuexamen_exam_results' AND column_name = 'device_id'
  ) THEN
    ALTER TABLE "iagentek_simuexamen_exam_results" ADD COLUMN device_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'iagentek_simuexamen_progress' AND column_name = 'device_id'
  ) THEN
    ALTER TABLE "iagentek_simuexamen_progress" ADD COLUMN device_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'iagentek_simuexamen_study_sessions' AND column_name = 'device_id'
  ) THEN
    ALTER TABLE "iagentek_simuexamen_study_sessions" ADD COLUMN device_id text;
  END IF;
END
$$;

-- Create indexes on device_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_exam_results_device_id
  ON "iagentek_simuexamen_exam_results" (device_id);

CREATE INDEX IF NOT EXISTS idx_progress_device_id
  ON "iagentek_simuexamen_progress" (device_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_device_id
  ON "iagentek_simuexamen_study_sessions" (device_id);

-- ---------------------------------------------------------------------------
-- 1. Drop existing permissive policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_exam_results"   ON "iagentek_simuexamen_exam_results";
DROP POLICY IF EXISTS "anon_insert_exam_results"   ON "iagentek_simuexamen_exam_results";

DROP POLICY IF EXISTS "anon_select_progress"       ON "iagentek_simuexamen_progress";
DROP POLICY IF EXISTS "anon_insert_progress"       ON "iagentek_simuexamen_progress";
DROP POLICY IF EXISTS "anon_update_progress"       ON "iagentek_simuexamen_progress";

DROP POLICY IF EXISTS "anon_select_study_sessions" ON "iagentek_simuexamen_study_sessions";
DROP POLICY IF EXISTS "anon_insert_study_sessions" ON "iagentek_simuexamen_study_sessions";

-- ---------------------------------------------------------------------------
-- 2. Ensure RLS is enabled (idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE "iagentek_simuexamen_exam_results"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "iagentek_simuexamen_progress"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "iagentek_simuexamen_study_sessions" ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Exam Results — device-scoped
--    SELECT: only rows matching the caller's x-device-id header
--    INSERT: allow (device_id is set by the app layer)
-- ---------------------------------------------------------------------------
CREATE POLICY "device_select_exam_results"
  ON "iagentek_simuexamen_exam_results"
  FOR SELECT TO anon
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');

CREATE POLICY "device_insert_exam_results"
  ON "iagentek_simuexamen_exam_results"
  FOR INSERT TO anon
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 4. Progress — device-scoped
--    SELECT: only own rows
--    ALL (insert/update/delete): only own rows
-- ---------------------------------------------------------------------------
CREATE POLICY "device_select_progress"
  ON "iagentek_simuexamen_progress"
  FOR SELECT TO anon
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');

CREATE POLICY "device_upsert_progress"
  ON "iagentek_simuexamen_progress"
  FOR ALL TO anon
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');

-- ---------------------------------------------------------------------------
-- 5. Study Sessions — device-scoped
--    SELECT: only own rows
--    INSERT: allow (device_id is set by the app layer)
-- ---------------------------------------------------------------------------
CREATE POLICY "device_select_sessions"
  ON "iagentek_simuexamen_study_sessions"
  FOR SELECT TO anon
  USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');

CREATE POLICY "device_insert_sessions"
  ON "iagentek_simuexamen_study_sessions"
  FOR INSERT TO anon
  WITH CHECK (true);
