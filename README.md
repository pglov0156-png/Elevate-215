# Elevate-215: Reconcile Check

Reconcile Check shows Stacy where each school Renée has visited stands, so she doesn't have to wait for Renée to get back from a visit. The project has two versions, kept separate so they can be compared:

| Version | Link | Spec | What it shows |
| --- | --- | --- | --- |
| **v1** | `/` | [SPEC1.md](SPEC1.md) | One page with a card per school: key grant metric, on-track/off-track status and Renée's notes |
| **v2** | `/v2` | [SPEC2.md](SPEC2.md) | A searchable school list, plus a dashboard for each school that connects its grant, payments, metric, status and Renée's notes |

## What each version shows

In both versions:

- **Key grant metric:** the Enrollment-Weighted Avg Residual from the School Rollup. This is how many points the school's proficiency is above or below its predicted proficiency.
- **Status:** **On Track** if the residual is 0 or higher, **Off Track** if it is below 0. A school with no test data shows **No test data**, and no status is guessed.
- **Renée's notes:** always shown exactly as she wrote them.

### v1 (`/`)

One card per school Renée has visited, in alphabetical order.

### v2 (`/v2`)

- **School list:** search by school name or SchoolNumber. Each school card shows its status, residual, amount promised, amount paid and last visit date.
- **School dashboard** (`/v2/<SchoolNumber>`) has four tabs:
  - **Overview:** the school's status, key metric, a grant summary and the latest visit, with buttons to open the grant agreement, view payments, view progress and read the visit notes.
  - **Grant:**
    - the grant agreement (title, link, term dates)
    - what was promised (award amount and commitments)
    - what was paid (payments list, total paid and remaining)
  - **Progress:** the residual on a scale, with On Track or Off Track.
  - **Visit Notes:** the v1 Reconcile Check card, reused as a tab.

Any grant or payment information that isn't known yet shows **Insert here** with an **Add** button. Whatever you enter is saved to `data/grants.csv` or `data/payments.csv`. Renée's notes and the test data can't be edited from the app.

## Running it

You need Node.js 20.19 or newer.

```bash
npm install
npm run dev        # starts the app at http://localhost:5173 (v1) and http://localhost:5173/v2 (v2)
```

| Command | What it does |
| --- | --- |
| `npm run check` | Runs the type check |
| `npm run build` | Builds the app for production |
| `npm run preview` | Serves the production build locally |

## Data

For now all data comes from CSV files in `data/`. There is no database yet. Every file connects to the others by `SchoolNumber`, so school names never have to be matched by hand.

| File | What it holds | Who updates it | Used by |
| --- | --- | --- | --- |
| `data/Elevate215-School-Data - PHL School Performance Model.xlsx - School Rollup.csv` | School performance data, one row per school, including the metric | Exported from the performance model spreadsheet | v1, v2 |
| `data/visit-notes.csv` | Renée's visit notes, one row per visit | Renée | v1, v2 |
| `data/grants.csv` | One grant per school: agreement title, link, term dates, award amount, commitments | The v2 dashboard ("Insert here" → Add) | v2 |
| `data/payments.csv` | One row per payment: date, amount, memo | The v2 dashboard ("+ Add payment") | v2 |

`visit-notes.csv` has these columns:

```csv
SchoolNumber,visit_date,notes
7510,2026-09-22,"Met with principal and literacy coach..."
```

- **`SchoolNumber`** must match a `SchoolNumber` in the School Rollup. If it doesn't, the row is skipped and the server logs a warning.
- **`visit_date`** is in `YYYY-MM-DD` format. If a school has more than one visit, the most recent one is shown.
- **`notes`** can contain commas and line breaks as long as it is wrapped in double quotes.

> The rows in `visit-notes.csv` that start with "SAMPLE NOTE" are placeholders. Replace them with Renée's real notes. `grants.csv` and `payments.csv` start empty on purpose.

To use files in other locations, copy `.env.example` to `.env` and change the paths.

## Project layout

```
src/
  lib/
    types.ts                      # v1: SchoolStatus
    server/
      csv.ts, csv-write.ts        # CSV reader and writer (shared)
      status.ts                   # the on-track rule, residual >= 0 (shared)
      repository.ts, csv-repository.ts, index.ts        # v1 data layer
      v2/
        repository.ts             # v2 data interface: list, get, update grant, add payment
        csv-record-repository.ts  # v2 CSV implementation (reads 4 files, writes 2)
        validate.ts               # checks input before anything is saved
        index.ts                  # picks the v2 implementation based on DATA_SOURCE
    v2/
      types.ts, format.ts, theme.css
      components/                 # StatusBadge, EditableField, ReconcileCard (copy of the v1 card)
  routes/
    +page.svelte, +page.server.ts # v1 (/)
    v2/                           # v2 (/v2 and /v2/[schoolNumber])
db/
  001_init.sql                    # planned schema: schools, metrics, visit notes
  002_grants.sql                  # planned schema: grants, commitments, payments
```

## Moving to a database

Both versions are set up so a database can replace the CSV files without changing any page. Each version reads through its own repository interface, and the on-track rule in `status.ts` is shared by every data source. v2's input checks happen before the repository is called, so they carry over too.

The planned schema is in [db/001_init.sql](db/001_init.sql) and [db/002_grants.sql](db/002_grants.sql).

Migration steps:

1. Create the tables from both SQL files.
2. Write a one-time import script (`scripts/import-csv.ts`) that reads all four CSVs with `src/lib/server/csv.ts` and inserts the rows.
3. Add database versions of the v1 and v2 repositories.
4. Add a `db` option to `src/lib/server/index.ts` and `src/lib/server/v2/index.ts`, then set `DATA_SOURCE=db`.
5. Compare the output against the CSV version, then remove the CSV implementations.

## Deployment

The app currently uses `@sveltejs/adapter-auto`, which can't yet tell where the app will run. Once a host is chosen, install that host's SvelteKit adapter and set it in `svelte.config.js`. v2 writes to `data/grants.csv` and `data/payments.csv`, so it needs a host with a persistent, writable disk, such as `@sveltejs/adapter-node` on a server. The alternative is to move to the database first.
