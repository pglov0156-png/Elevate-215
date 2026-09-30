# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Reconcile Check (Elevate-215) is a single-page SvelteKit app. For each school Renée has visited, it shows three things:

- the key grant metric
- on-track or off-track status
- Renée's original visit notes, word for word

[SPEC.md](SPEC.md) is the source of truth. The page must match the spec's output exactly. Don't add summary counts, filters, sorting controls or other UI the spec doesn't ask for.

## Commands

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run check     # svelte-kit sync + svelte-check (TypeScript); this is the only static check
npm run build     # production build (adapter-auto warns that no host is chosen yet; that's expected)
```

There is no test runner or linter configured. To verify changes, run `npm run check` and `npm run build`, then load `/` and compare the cards against rows in the CSVs.

## Architecture

The page never touches storage directly. Data flows through a repository interface so a database can replace the CSV files later without changing the page:

`+page.server.ts` → `getRepository()` (`src/lib/server/index.ts`, chosen by `DATA_SOURCE`, default `csv`) → `SchoolStatusRepository` (`repository.ts`) → `CsvSchoolStatusRepository` (`csv-repository.ts`) → `SchoolStatus[]` (`src/lib/types.ts`) → `+page.svelte`

- **The join.** `csv-repository.ts` reads the School Rollup CSV and `data/visit-notes.csv`, and matches them on `SchoolNumber`:
  - Only schools that have notes are returned.
  - When a school has several visits, the latest `visit_date` wins.
  - A note whose `SchoolNumber` isn't in the rollup is skipped, and the server logs a warning.
  - Results are sorted by school name.
- **The metric and status rule.**
  - The metric is the rollup column `Enrollment-Weighted Avg Residual`.
  - The on-track rule is `residual >= 0` and lives only in `status.ts`, so every data source shares it.
  - A blank residual gives `metricValue: null` and `status: null`, which the page shows as "No test data".
- **CSV parsing.** `csv.ts` is a hand-written parser that handles quoted commas, `""` and newlines, and strips the BOM. Use it rather than adding a CSV dependency.
- **Rollup headers.** Headers in the rollup CSV contain em dashes (e.g. `PSSA Reading — Band`) and are keyed exactly as written.
- **File paths.** File locations come from `ROLLUP_CSV` and `NOTES_CSV` (see `.env.example`). They are read via `$env/dynamic/private` and resolved relative to the process working directory.

## Database migration (planned, not started)

[db/001_init.sql](db/001_init.sql) is the target Postgres schema. It is not wired in, and no database driver is installed. The planned migration:

1. Create the tables.
2. Write a one-time `scripts/import-csv.ts` that reuses `csv.ts`.
3. Add `src/lib/server/db-repository.ts` that implements `SchoolStatusRepository`.
4. Add a `db` case in `src/lib/server/index.ts`.
5. Compare the page output against the CSV output, then retire the CSV repository.

## Data notes

- Rows in `data/visit-notes.csv` that start with "SAMPLE NOTE" are placeholders, not real visit data.
- The rollup CSV has 301 schools: 219 District and 82 Charter.
