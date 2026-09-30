# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Reconcile Check (Elevate-215) is a SvelteKit app with two versions that are deliberately kept separate so they can be compared. Don't merge them, or their specs, unless asked.

| Version | Route | Spec | What it is |
| --- | --- | --- | --- |
| v1 | `/` | [SPEC1.md](SPEC1.md) | One page. For each visited school, a card with the key grant metric, on-track/off-track status and Renée's notes. |
| v2 | `/v2`, `/v2/[schoolNumber]` | [SPEC2.md](SPEC2.md) | A searchable school list, plus a dashboard per school with tabs: Overview, Grant, Progress and Visit Notes. |

- **Keep v1 unchanged.** Leave `src/routes/+page.svelte`, `src/routes/+page.server.ts` and v1's `src/lib/server/{repository,csv-repository,index}.ts` alone unless asked.
- **The v2 Visit Notes tab** is a copy of the v1 card, in `src/lib/v2/components/ReconcileCard.svelte`. If the v1 card changes, update the copy to match.
- **Each spec's output is exact.** Build what its spec lists and nothing more.

## Commands

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run check     # svelte-kit sync + svelte-check (TypeScript); this is the only static check
npm run build     # production build (adapter-auto warns that no host is chosen yet; that's expected)
```

There is no test runner or linter configured. To verify changes:

1. Run `npm run check` and `npm run build`.
2. Load `/` and `/v2`, and compare the output against rows in the CSVs.
3. To try the save actions with curl, send `-H "Origin: http://localhost:<port>" -H "x-sveltekit-action: true"` to `/v2/<n>?/saveGrant` or `?/addPayment`.

Back up `data/grants.csv` and `data/payments.csv` before testing writes, and restore them afterwards.

## Architecture

Pages never touch storage directly. Each version reads through its own repository interface, which is picked by `DATA_SOURCE` (default `csv`), so a database can replace the CSVs later without changing the pages.

- **v1:** `+page.server.ts` → `getRepository()` in `src/lib/server/index.ts` → `SchoolStatusRepository` → `CsvSchoolStatusRepository` → `SchoolStatus[]` (`src/lib/types.ts`)
- **v2:** `routes/v2/**/+page.server.ts` → `getRecordRepository()` in `src/lib/server/v2/index.ts` → `SchoolRecordRepository` (list, get, updateGrantField, addPayment) → `CsvSchoolRecordRepository` → `SchoolRecord` (`src/lib/v2/types.ts`)

Rules both versions follow:

- **Joining.** Every file is joined on `SchoolNumber` only, never on school names.
  - Only schools with a row in `data/visit-notes.csv` are shown.
  - When a school has several visits, the latest `visit_date` wins.
  - A note whose `SchoolNumber` isn't in the rollup is skipped, and the server logs a warning.
- **Status.** The metric is the rollup column `Enrollment-Weighted Avg Residual`. The on-track rule is `residual >= 0`, in `src/lib/server/status.ts`, shared by both versions. A blank residual gives `status: null` ("No test data"). Never infer a status.
- **Notes.** Renée's notes are rendered verbatim as plain text with `white-space: pre-wrap`. Never edit, trim or summarize them.
- **CSV parsing.** `src/lib/server/csv.ts` is a hand-written parser (quoted commas, `""`, newlines, BOM). `csv-write.ts` is its matching writer, which writes through a temp file and rename. Use these instead of adding a CSV dependency.
- **Rollup headers.** They contain em dashes (e.g. `PSSA Reading — Band`) and are keyed exactly as written.
- **File paths.** They come from `ROLLUP_CSV`, `NOTES_CSV`, `GRANTS_CSV` and `PAYMENTS_CSV` (see `.env.example`), are read via `$env/dynamic/private`, and are resolved relative to the process working directory.

v2 specifics:

- **Editable data.** Grant and payment data is the only data users can edit. Any empty field shows "Insert here" with an Add button.
- **Saving.** Form actions in `routes/v2/[schoolNumber]/+page.server.ts` validate input with `src/lib/server/v2/validate.ts` (agreement links must be http(s), plus money and date checks) before the repository writes it. The CSV repository runs writes one at a time through an in-process queue.
- **Tabs.** Tabs are local state and are mirrored into `?tab=` with `replaceState` (shallow routing), so switching tabs never navigates away.
- **Styles.** v2 styles live in `src/lib/v2/theme.css`. Every rule is scoped under the `.v2` wrapper in `routes/v2/+layout.svelte`, so v1 is unaffected.

## Database migration (planned, not started)

The target Postgres schema is in [db/001_init.sql](db/001_init.sql) (schools, metrics and visit notes) and [db/002_grants.sql](db/002_grants.sql) (grants, grant commitments and payments). Neither is wired in, and no database driver is installed.

The planned migration:

1. Create the tables.
2. Write a one-time `scripts/import-csv.ts` that reuses `csv.ts` for all four CSVs. It should split `grants.commitments` on newlines into `grant_commitments`.
3. Add database versions of both repositories.
4. Add a `db` case to both `index.ts` files.
5. Compare the output against the CSV version, then retire the CSV repositories.

## Data notes

- Rows in `data/visit-notes.csv` that start with "SAMPLE NOTE" are placeholders, not real visit data.
- `data/grants.csv` and `data/payments.csv` intentionally start with headers only. Don't seed them with invented grant or payment figures.
- The rollup CSV has 301 schools: 219 District and 82 Charter.
