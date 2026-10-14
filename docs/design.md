# Design notes

How the requirements in [requirements.md](requirements.md) map onto data, API and code. The
component view is in [architecture.md](architecture.md).

## Data model

Two tables. Countries, departments and job titles are plain columns, not lookup tables: the
supported countries and their currencies are a constant in code (they drive validation), and the
filter options for departments and job titles come from `SELECT DISTINCT` on indexed columns. A
lookup table would add joins and CRUD screens nobody asked for.

**`employees`**

| Column                     | Type                        | Notes                                                         |
| -------------------------- | --------------------------- | ------------------------------------------------------------- |
| `id`                       | INTEGER PK                  | Auto-increment                                                |
| `first_name`, `last_name`  | TEXT NOT NULL               | Trimmed, 1–100 chars                                          |
| `email`                    | TEXT NOT NULL UNIQUE NOCASE | Trimmed; uniqueness ignores case                              |
| `job_title`, `department`  | TEXT NOT NULL               | Trimmed, 1–100 chars                                          |
| `country`                  | TEXT NOT NULL               | ISO 3166-1 alpha-2, one of the supported countries            |
| `currency`                 | TEXT NOT NULL               | ISO 4217, always the country's currency                       |
| `salary_minor`             | INTEGER NOT NULL            | Current salary in minor units, mirrors the latest history row |
| `hire_date`                | TEXT NOT NULL               | `YYYY-MM-DD`, not in the future                               |
| `version`                  | INTEGER NOT NULL DEFAULT 1  | Optimistic concurrency token                                  |
| `created_at`, `updated_at` | TEXT NOT NULL               | ISO timestamps                                                |

**`salary_history`**: `id`, `employee_id` (FK, `ON DELETE CASCADE`), `salary_minor`, `currency`,
`effective_date`, `reason`, `created_at`.

The current salary is denormalised onto `employees` so the list can filter and sort on it with an
index instead of joining to the latest history row. Both are written in the same transaction, so
they cannot drift.

## Money

- Amounts are integers in the currency's minor unit (cents, paise; yen has none), never floats.
- Currency is an ISO 4217 code stored next to every amount, including in history rows.
- Valid salary: a positive integer up to 10^12 minor units. Zero, negatives, fractions and anything
  larger are rejected with a 400.
- The client converts between major and minor units using the currency's fraction digits from
  `Intl.NumberFormat`, and formats every amount with `Intl.NumberFormat` in its own currency.
- Amounts in different currencies are never combined. Every aggregate is grouped by currency.

## Rules worth spelling out

- **Currency follows country.** Create and salary-change requests send `currency`, which must be a
  supported code and match the employee's country. Sending it explicitly makes a mismatch a clear
  400 instead of a silent assumption.
- **Country is fixed after creation.** A relocation means a new salary in a new currency, which is
  a bigger workflow than an edit. It is out of scope and recorded as a trade-off.
- **Effective dates** must be on or after the hire date and not in the future. Scheduled raises
  would mean the current salary depends on today's date, which we avoid.
- **Current salary** is the history row with the latest `(effective_date, id)`. Back-dated changes
  are allowed, and the current salary is recomputed from history inside the transaction.
- **Deleting** an employee removes their history through the cascade.

## API

All routes are under `/api` and exchange JSON. Ids are positive integers; anything else is a 400.

| Method | Path                                 | Purpose                                                  |
| ------ | ------------------------------------ | -------------------------------------------------------- |
| GET    | `/health`                            | Liveness and database check                              |
| GET    | `/meta`                              | Countries with currencies, departments, job titles       |
| GET    | `/employees`                         | Paginated list with search, filters and sort             |
| POST   | `/employees`                         | Create, with the initial salary as the first history row |
| GET    | `/employees/:id`                     | One employee                                             |
| PUT    | `/employees/:id`                     | Edit profile fields; requires `version`                  |
| DELETE | `/employees/:id`                     | Delete with history                                      |
| GET    | `/employees/:id/salary-history`      | History, newest first                                    |
| POST   | `/employees/:id/salary-changes`      | Change salary; requires `version`                        |
| GET    | `/insights/countries`                | Headcount, min, max, average, median per country         |
| GET    | `/insights/groups?by=&currency=`     | Same stats per department or job title, for one currency |
| GET    | `/insights/distribution?currency=`   | Salary bands for one currency                            |
| GET    | `/insights/earners?currency=&limit=` | Top and bottom earners for one currency                  |

List query parameters: `page` (default 1), `pageSize` (default 25, max 100), `sort` (one of
`name`, `email`, `country`, `department`, `jobTitle`, `salary`, `hireDate`), `order` (`asc` or
`desc`), `search`, `country`, `department`, `jobTitle`, `currency`, `minSalary`, `maxSalary`.

## Querying the list

- **Pagination** is offset-based and returns `{ items, page, pageSize, total, totalPages }`. At
  10,000 rows an offset scan is cheap, and numbered pages are what HR expects from a table. A page
  past the end returns an empty `items` with the real `total`.
- **Sorting** maps the `sort` value through a whitelist to a fixed SQL expression, so no user input
  reaches the `ORDER BY`. `id` is always the final tie-breaker so pages are stable.
- **Salary filter and sort** only make sense within one currency. A salary range requires a
  `currency` filter, and sorting by salary orders by currency first.
- **Search** is a case-insensitive substring match on full name and email via `LIKE` with escaped
  wildcards. It scans, but 10,000 short rows scan in a few milliseconds; FTS5 would be premature.
- Every value is bound as a parameter. Total and page come from the same `WHERE` clause.

## Indexes

| Index                                             | Serves                                    |
| ------------------------------------------------- | ----------------------------------------- |
| `employees(email COLLATE NOCASE)` unique          | Uniqueness, email sort                    |
| `employees(last_name, first_name)`                | Name sort                                 |
| `employees(country)`                              | Country filter, country insights          |
| `employees(department)`                           | Department filter, `DISTINCT` for filters |
| `employees(job_title)`                            | Job title filter, `DISTINCT` for filters  |
| `employees(currency, salary_minor)`               | Salary range, salary sort, all insights   |
| `employees(hire_date)`                            | Hire date sort                            |
| `salary_history(employee_id, effective_date, id)` | History per employee, current salary      |

## Insights and percentiles

Count, min, max and average are SQL aggregates grouped by currency and the chosen dimension. The
average is rounded to the nearest minor unit.

SQLite has no median, so each query also streams salaries ordered by group and amount using the
`(currency, salary_minor)` index. A pure function then takes percentiles over each sorted group
with linear interpolation between the two closest ranks. That gives the textbook median for both
odd and even counts, returns the single value for a one-row group, and returns `null` for an
empty one. Keeping this in a pure function makes it easy to unit test with tiny fixtures.

Distribution uses equal-width bands between the currency's min and max (10 by default). If every
salary is equal there is one band. Top and bottom earners are per currency, ordered by salary with
`id` as the tie-breaker.

## Optimistic concurrency

Edits and salary changes send the `version` they last read. The update runs
`WHERE id = ? AND version = ?` and increments the version. Zero changed rows means either the
employee is gone (404) or someone else saved first (409 `CONFLICT`); the client then reloads and
shows the latest data.

## Errors

Every error response has one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [{ "path": "email", "message": "Invalid email" }]
  }
}
```

Codes: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `CONFLICT` (409, duplicate email or stale
version), `INTERNAL_ERROR` (500, no internals leaked). Zod errors, SQLite unique-constraint errors
and domain errors are translated in one central handler.

## Code structure

The server is layered: routes declare paths, controllers parse and validate input with Zod and
shape responses, services hold business rules and transactions, repositories hold SQL. Only
repositories import the database. Migrations are numbered `.sql` files applied in order and
tracked in a `schema_migrations` table; the connection enables WAL mode and foreign keys.

The client uses MUI, React Router and TanStack Query. A typed API client wraps `fetch` and turns
error responses into typed errors. List state (page, sort, filters, search) lives in the URL so
views are shareable and survive a refresh.

## Trade-offs

- SQLite over Postgres: one file, no server to run, fast for this size. The cost is a single
  writer and a deployment that needs a persistent disk.
- Offset pagination over keyset: simpler, supports numbered pages, fine at 10,000 rows.
- Denormalised current salary: faster list queries in exchange for keeping two writes in sync,
  which one transaction handles.
- Medians computed in application code over sorted rows: correct and testable, at the cost of
  reading every salary once per insights request.
- No future-dated salary changes and no relocations: keeps "current salary" a stored fact.

## Performance considerations

- Every filter and sort column is indexed, and filter options come from index-only `DISTINCT`.
- Page size is capped at 100 so responses stay small.
- Prepared statements are reused, and the seed inserts 10,000 rows in a single transaction.
- WAL mode lets reads continue during writes.
- On the client, search is debounced, and TanStack Query caches pages and keeps the previous page
  visible while the next one loads.
- Measured numbers go in `performance.md` once the seed exists.
