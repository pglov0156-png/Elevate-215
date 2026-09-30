-- PLANNED schema for v2 (/v2) grant and payment records. Not used by the app yet.
-- Builds on 001_init.sql (schools, school_metrics, visit_notes).
-- Migration path: run after 001 -> extend scripts/import-csv.ts to load data/grants.csv and
-- data/payments.csv -> add src/lib/server/v2/db-record-repository.ts implementing
-- SchoolRecordRepository -> add the 'db' case in src/lib/server/v2/index.ts.

-- One grant per school today (CSV); the table allows several per school later.
CREATE TABLE grants (
    id               BIGSERIAL PRIMARY KEY,
    school_number    TEXT NOT NULL REFERENCES schools(school_number),
    agreement_title  TEXT NULL,               -- NULL = "Insert here"
    agreement_url    TEXT NULL CHECK (agreement_url ~ '^https?://'),
    term_start       DATE NULL,
    term_end         DATE NULL,
    award_amount     NUMERIC(12, 2) NULL CHECK (award_amount >= 0),   -- what was promised ($)
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX grants_school ON grants (school_number);

-- What was promised (commitments). CSV stores these one per line in grants.commitments.
CREATE TABLE grant_commitments (
    id        BIGSERIAL PRIMARY KEY,
    grant_id  BIGINT NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
    position  INT NOT NULL,
    text      TEXT NOT NULL
);

-- What was paid.
CREATE TABLE payments (
    id            BIGSERIAL PRIMARY KEY,
    grant_id      BIGINT NOT NULL REFERENCES grants(id),
    payment_date  DATE NOT NULL,
    amount        NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    memo          TEXT NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payments_grant_date ON payments (grant_id, payment_date DESC);
