-- =============================================================================
-- Supabase Schema for Simulador de Examen CSA
-- Naming convention: "iagentek_simuexamen_{table_name}"
-- Note: Underscored table names used for compatibility.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Exam Results
-- Stores every completed exam attempt with full scoring breakdown.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "iagentek_simuexamen_exam_results" (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "examId"      text NOT NULL,
  score         integer NOT NULL DEFAULT 0,
  "weightedScore" integer,                              -- CCA-F: 0-1000 scale
  passed        boolean,                                -- CCA-F: >= 720
  mode          text NOT NULL DEFAULT 'standard',       -- standard | ccaf | practice | study
  domains       text[] NOT NULL DEFAULT '{}',           -- array of domain codes
  summary       jsonb NOT NULL DEFAULT '{}',            -- ExamSummary object
  "domainScores" jsonb,                                 -- DomainScore[] for CCA-F
  "completedAt" timestamptz NOT NULL DEFAULT now(),
  "durationSec" integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fetching history sorted by date
CREATE INDEX IF NOT EXISTS idx_exam_results_completed
  ON "iagentek_simuexamen_exam_results" ("completedAt" DESC);

-- Index for filtering by mode
CREATE INDEX IF NOT EXISTS idx_exam_results_mode
  ON "iagentek_simuexamen_exam_results" (mode);

-- ---------------------------------------------------------------------------
-- 2. Learning Progress
-- One row per track — upserted on each update.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "iagentek_simuexamen_progress" (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "trackId"           text NOT NULL UNIQUE,              -- natural key for upsert
  "completedModules"  jsonb NOT NULL DEFAULT '[]',       -- string[] of module IDs
  "theoryCompleted"   boolean NOT NULL DEFAULT false,
  "practiceCompleted" boolean NOT NULL DEFAULT false,
  "examAttempts"      integer NOT NULL DEFAULT 0,
  "bestExamScore"     integer NOT NULL DEFAULT 0,
  "lastAccessedAt"    timestamptz NOT NULL DEFAULT now(),
  "totalTimeSpentSec" integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Index for ordering by last access
CREATE INDEX IF NOT EXISTS idx_progress_last_accessed
  ON "iagentek_simuexamen_progress" ("lastAccessedAt" DESC);

-- ---------------------------------------------------------------------------
-- 3. Study Sessions
-- Granular study activity log for analytics.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "iagentek_simuexamen_study_sessions" (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "sessionId"         text NOT NULL,
  "trackId"           text NOT NULL,
  "contentType"       text NOT NULL DEFAULT 'theory',    -- theory | practice | exam
  "questionsAnswered" integer NOT NULL DEFAULT 0,
  "correctAnswers"    integer NOT NULL DEFAULT 0,
  "durationSec"       integer NOT NULL DEFAULT 0,
  "startedAt"         timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Index for filtering by track and date
CREATE INDEX IF NOT EXISTS idx_study_sessions_track
  ON "iagentek_simuexamen_study_sessions" ("trackId", "startedAt" DESC);

-- ---------------------------------------------------------------------------
-- 4. Leaderboard (Materialized View)
-- Top exam scores across all users, refreshable on demand.
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "iagentek_simuexamen_leaderboard" AS
SELECT
  ROW_NUMBER() OVER (ORDER BY score DESC, "completedAt" ASC) AS rank,
  score,
  mode,
  "completedAt"
FROM "iagentek_simuexamen_exam_results"
WHERE mode IN ('ccaf', 'standard')
ORDER BY score DESC, "completedAt" ASC
LIMIT 100;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_rank
  ON "iagentek_simuexamen_leaderboard" (rank);

-- To refresh:  REFRESH MATERIALIZED VIEW CONCURRENTLY "iagentek_simuexamen_leaderboard";

-- ---------------------------------------------------------------------------
-- 5. Row Level Security (RLS)
-- Allow anonymous (anon) access since we are not using auth yet.
-- ---------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE "iagentek_simuexamen_exam_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "iagentek_simuexamen_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "iagentek_simuexamen_study_sessions" ENABLE ROW LEVEL SECURITY;

-- Exam Results: anon can SELECT and INSERT
CREATE POLICY "anon_select_exam_results"
  ON "iagentek_simuexamen_exam_results"
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_exam_results"
  ON "iagentek_simuexamen_exam_results"
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Progress: anon can SELECT, INSERT, and UPDATE
CREATE POLICY "anon_select_progress"
  ON "iagentek_simuexamen_progress"
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_progress"
  ON "iagentek_simuexamen_progress"
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_progress"
  ON "iagentek_simuexamen_progress"
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Study Sessions: anon can SELECT and INSERT
CREATE POLICY "anon_select_study_sessions"
  ON "iagentek_simuexamen_study_sessions"
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_study_sessions"
  ON "iagentek_simuexamen_study_sessions"
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 6. Auto-update trigger for progress.updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_progress_updated_at
  BEFORE UPDATE ON "iagentek_simuexamen_progress"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
