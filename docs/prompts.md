# Prompt log

A record of what was asked of the AI assistant during this build, and what was decided as a
result. Entries are in chronological order.

## 1. Brief and plan (Phase 0 kick-off)

**Asked:** Build employee salary management software for an organisation with 10,000 employees,
for an HR Manager persona who currently maintains salary data for staff across multiple countries
in Excel. Required: a one-page requirements doc written before any code; an end-to-end working
product (Node.js + TypeScript backend, React + Vite + TypeScript frontend, a component library, a
relational database — SQLite); a seed script producing 10,000 employees; meaningful, fast,
deterministic unit tests; production-quality structure with no dead code, unused dependencies or
placeholder TODOs; incremental Git commits; committed artifacts (requirements, design notes,
architecture diagram, this prompt log, trade-off notes, performance notes); and deployment
instructions. The work was broken into phases 0–10, each ending in lint + typecheck + tests and a
single conventional commit.

**Standing rules agreed:** strict TypeScript with no `any`; small functions and meaningful names;
comments only where the "why" is not obvious; no `console.log` left behind; no speculative features
beyond the requirements doc; when a decision is ambiguous, take the simpler option and record it in
`docs/tradeoffs.md`. Never commit build output, `node_modules`, `.env` or the database file.

**Decided in Phase 0:** npm workspaces monorepo with `server/` and `client/`; a shared strict
`tsconfig.base.json`; ESLint (flat config, type-aware rules) plus Prettier at the root; Vitest as
the single test runner on both sides; root scripts for `dev`, `build`, `start`, `seed`, `test`,
`lint` and `typecheck`.

## 2. Requirements doc (Phase 1)

**Asked:** Write a strictly one-page `docs/requirements.md` covering goal, user, core features,
non-goals with reasoning and assumptions. Features: a server-side paginated, sortable, searchable
and filterable employee list; employee create/edit/delete with validation; salary changes with
effective date, reason and history; and an insights dashboard per country, department and job
title with distribution bands and top/bottom earners, never summing across currencies.

**Decided:** Salary is stored as integer minor units with an ISO 4217 code. All aggregates and
rankings are grouped by currency. Concurrent edits are detected rather than overwritten. Bulk
import/export was added to the non-goals as a natural next step rather than an MVP feature.

## 3. Design and architecture (Phase 2)

**Asked:** Write `docs/design.md` and `docs/architecture.md` (with a Mermaid diagram) covering the
data model, API, indexing, money handling, pagination, median/percentile computation, optimistic
concurrency, error format, trade-offs and performance.

**Decided:** Two tables, no lookup tables. Current salary is denormalised onto `employees` and kept
in sync with history in one transaction. Offset pagination capped at 100 per page; sort columns
whitelisted. Salary filters and sorts are scoped to a currency. Medians use linear interpolation
in a pure function over salaries streamed in sorted order. Edits and salary changes carry a
`version` and return 409 when stale. Currency must match the country; country is fixed after
creation; salary changes cannot be future-dated.

## 4. Backend foundation (Phase 3)

**Asked:** Express + TypeScript layered as routes → controllers → services → repositories;
better-sqlite3 with versioned SQL migrations, WAL and foreign keys; Zod validation; a central
error handler with consistent JSON errors; request logging; validated env config; a health
endpoint; indexes for every filter and sort column.

**Decided:** Migrations are numbered `.sql` files in `server/migrations`, tracked in
`schema_migrations` and applied one transaction each. Tables are `STRICT` with `CHECK`
constraints as a second line of defence behind Zod. Logging is a tiny JSON-lines logger rather
than a logging library, since we only need one line per request and per error. The app is built
by a `createApp({ db, logger })` factory so tests run against an in-memory database with
Supertest. Test files are excluded from the production build via `tsconfig.build.json`.

## 5. Employee API (Phase 4)

**Asked:** CRUD plus a paginated, sortable, filterable, searchable list with whitelisted sort
columns, parameterised queries and a capped page size; a salary-change endpoint that writes
history in one transaction; and tests for the listed edge cases (bad salaries, unsupported
currency, duplicate email, unknown and malformed ids, out-of-range pages, blank names, email
normalisation, effective-date bounds, stale versions, deleting with history). Separate feat and
test commits.

**Decided:** Emails are trimmed and lower-cased; uniqueness is also enforced by a `NOCASE` unique
column. Oversized page sizes are capped to 100 rather than rejected. Unknown body fields are
rejected, which is also how a country change on edit is refused. A hire date cannot move past
the first salary date. The service takes an injectable clock so date rules test
deterministically. `GET /api/meta` serves the filter options.

## 6. Insights API (Phase 5)

**Asked:** Aggregations in SQL where sensible; medians and percentiles correct for odd, even and
empty groups; everything grouped by currency, including distribution bands; tests on small
deterministic fixtures including empty and single-row groups.

**Decided:** Count, min, max and average come from SQL `GROUP BY`; median, p25 and p75 come from
a pure interpolating `percentile` function over salaries streamed in sorted order. Department,
job title, distribution and earner views all take a required `currency`. Bands are equal-width
between the currency's min and max; a group where everyone earns the same gets one band.

## 7. Seeding (Phase 6)

**Asked:** A deterministic seed (seeded RNG, no network) creating exactly 10,000 employees across
about 10 countries with plausible currencies, departments, job titles, salary ranges, hire dates,
unique emails and initial salary history; idempotent; one transaction with prepared statements;
a few seconds at most; tests for determinism and uniqueness.

**Decided:** Mulberry32 as the seeded RNG. Salaries come from a per-country base salary times a
per-role multiplier with ±20% spread, rounded to 100 major units, then walked back through 0–4
historical raises so history ends exactly at the current salary. Re-running wipes and reinserts
in one transaction, so the result is identical every time, timestamps included. The generated
employees are checked against the API's own create schema. Measured: about 0.4 s for 10,000
employees and ~26,500 history rows.
