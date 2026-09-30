# Elevate-215: Reconcile Check

For each school Renée has visited, Reconcile Check shows its key grant metric and whether it is on-track or off-track, with Renée's original visit notes next to them. Stacy can see where each school stands from her desk without waiting for Renée to get back from a visit. See [SPEC.md](SPEC.md) for the full spec.

## What the page shows

The page has one card per school Renée has visited, in alphabetical order. Each card has:

- **Key grant metric:** the Enrollment-Weighted Avg Residual from the School Rollup. This is how many points the school's proficiency is above or below its predicted proficiency.
- **Status:** **On-track** if the residual is 0 or higher, **Off-track** if it is below 0. If a school has no test data, the card says **No test data**.
- **Renée's visit notes:** her notes exactly as written, with the visit date.

## Running it

You need Node.js 20.19 or newer.

```bash
npm install
npm run dev        # starts the app at http://localhost:5173
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run check` | Runs the type check |
| `npm run build` | Builds the app for production |
| `npm run preview` | Serves the production build locally |

## Data

For now all data comes from CSV files in `data/`. There is no database yet.

| File | What it holds | Who updates it |
| --- | --- | --- |
| `data/Elevate215-School-Data - PHL School Performance Model.xlsx - School Rollup.csv` | School performance data, one row per school, including the metric | Exported from the performance model spreadsheet |
| `data/visit-notes.csv` | Renée's visit notes, one row per visit | Renée |

`visit-notes.csv` has these columns:

```csv
SchoolNumber,visit_date,notes
7510,2026-09-22,"Met with principal and literacy coach..."
```

- **`SchoolNumber`** must match a `SchoolNumber` in the School Rollup. If it doesn't, the row is skipped and the server logs a warning.
- **`visit_date`** is in `YYYY-MM-DD` format. If a school has more than one visit, the page shows the most recent one.
- **`notes`** can contain commas and line breaks as long as it is wrapped in double quotes.

> The rows in `visit-notes.csv` that start with "SAMPLE NOTE" are placeholders. Replace them with Renée's real notes.

To use files in other locations, copy `.env.example` to `.env` and change `ROLLUP_CSV` or `NOTES_CSV`.

## Project layout

```
src/
  lib/
    types.ts                  # SchoolStatus: the shape of each card
    server/
      csv.ts                  # CSV parser (handles quoted fields, commas and line breaks)
      status.ts               # the on-track rule (residual >= 0)
      repository.ts           # SchoolStatusRepository interface: the only way the app reads data
      csv-repository.ts       # the current implementation: reads and joins the two CSVs
      index.ts                # picks the implementation based on DATA_SOURCE
  routes/
    +page.server.ts           # loads the schools
    +page.svelte              # renders the cards
db/
  001_init.sql                # planned database schema (not used yet)
data/                         # CSV inputs
```

## Moving to a database

The app is set up so a database can replace the CSV files without changing the page. The page only uses the `SchoolStatusRepository` interface, and the on-track rule lives in `status.ts`, which any data source can share.

The planned schema is in [db/001_init.sql](db/001_init.sql). It has three tables: `schools`, `school_metrics` (one row per school per year, so older years are kept) and `visit_notes` (any number of visits per school).

Migration steps:

1. Create the tables from `db/001_init.sql`.
2. Write a one-time import script (`scripts/import-csv.ts`) that reads the existing CSVs with `src/lib/server/csv.ts` and inserts the rows.
3. Add `src/lib/server/db-repository.ts`, which implements `SchoolStatusRepository`.
4. Add a `db` option in `src/lib/server/index.ts` and set `DATA_SOURCE=db`.
5. Compare the page's output with the CSV version, then remove the CSV implementation.

## Deployment

The app currently uses `@sveltejs/adapter-auto`, which can't yet tell where the app will run. Once a host is chosen, install that host's SvelteKit adapter (for example `@sveltejs/adapter-node` for a plain Node server) and set it in `svelte.config.js`.
