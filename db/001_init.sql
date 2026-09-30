-- PLANNED schema for the database migration. Not used by the app yet.
-- Migration path: create these tables -> run a one-time scripts/import-csv.ts that loads the
-- two CSVs via src/lib/server/csv.ts -> add src/lib/server/db-repository.ts implementing
-- SchoolStatusRepository -> set DATA_SOURCE=db -> compare output with CSV -> retire CSV repo.

CREATE TABLE schools (
    school_number  TEXT PRIMARY KEY,          -- SchoolNumber
    aun            TEXT NOT NULL,             -- AUN
    name           TEXT NOT NULL,             -- SchoolName
    school_type    TEXT NOT NULL              -- SchoolType (Charter | District)
);

-- One row per school per year, so new rollups add history instead of overwriting.
CREATE TABLE school_metrics (
    school_number          TEXT NOT NULL REFERENCES schools(school_number),
    school_year            TEXT NOT NULL,     -- e.g. '2025-26'
    weighted_avg_residual  NUMERIC NULL,      -- Enrollment-Weighted Avg Residual; NULL = no test data
    PRIMARY KEY (school_number, school_year)
);

-- Multiple visits per school; the page shows the latest.
CREATE TABLE visit_notes (
    id             BIGSERIAL PRIMARY KEY,
    school_number  TEXT NOT NULL REFERENCES schools(school_number),
    visit_date     DATE NOT NULL,
    notes          TEXT NOT NULL,             -- stored verbatim
    author         TEXT NOT NULL DEFAULT 'Renée',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX visit_notes_school_date ON visit_notes (school_number, visit_date DESC);
