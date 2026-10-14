# Trade-offs

The decisions we made on purpose, what each one costs, and when we would revisit it. Where the
brief was ambiguous we took the simpler option and recorded it here.

## Product scope

| Decision                                | Why                                                                                 | Cost                                                                                | Revisit when                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| No authentication or roles              | One persona with full access; auth would add setup without showing product thinking | Anyone who can reach the app can change salaries                                    | Before any real deployment: put SSO in front of `/api`         |
| Reporting only in local currency, no FX | Exchange rates drift daily and would make insights silently change                  | No single "total payroll" number across countries                                   | Finance needs consolidated reporting at a fixed, recorded rate |
| Country is fixed after hiring           | A relocation is a salary in a new currency, a bigger workflow than an edit          | HR has to delete and re-create someone who moves                                    | Relocations become a real workflow                             |
| No future-dated salary changes          | Keeps "current salary" a stored fact, not a function of today's date                | Scheduled raises are entered on the day they apply                                  | HR plans raises ahead of time                                  |
| Back-dated changes are allowed          | HR often records changes late                                                       | The newest entry is not always the current salary, so it is recomputed from history | Never; this is a real need                                     |
| Hard delete with cascade                | The requirement was delete; history belongs to the employee                         | Deleted data is gone, with no undo                                                  | Audit or legal retention rules apply: switch to soft delete    |
| No bulk import/export                   | The seed covers demo data; CRUD was the brief                                       | Migrating from Excel is manual                                                      | First real customer onboarding                                 |

## Data and API

| Decision                                             | Why                                                                                              | Cost                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| SQLite instead of Postgres                           | One file, no server, very fast at 10,000 rows, trivial to run locally and in CI                  | Single writer; production needs a persistent disk; no horizontal scaling       |
| Integer minor units plus ISO 4217 code               | No floating-point rounding, and every amount carries its currency                                | The UI has to convert using each currency's fraction digits (yen has none)     |
| Currency sent explicitly and checked against country | A mismatch becomes a clear 400 instead of a silent assumption                                    | One redundant field in requests                                                |
| Current salary denormalised onto `employees`         | List filters and sorts hit one indexed column instead of joining to the latest history row       | Two writes to keep in sync, handled by one transaction                         |
| Offset pagination                                    | Numbered pages are what an HR table needs, and it is fast at this size                           | Deep pages scan more rows; would not scale to millions                         |
| Oversized page size is capped, not rejected          | Friendlier for API callers; the response says which size was used                                | A caller asking for 5,000 silently gets 100                                    |
| Salary filter and sort scoped to a currency          | Comparing amounts across currencies is meaningless                                               | Users must pick a currency before filtering by salary                          |
| Substring search with `LIKE`                         | Matches anywhere in the name or email, which HR expects; a scan of 10,000 rows takes ~3 ms       | Will not use an index; FTS5 would be needed at much larger sizes               |
| Medians computed in TypeScript                       | SQLite has no median; a pure function is correct for odd, even and empty groups and easy to test | Each insights request reads the salaries of the groups it reports              |
| Department and job title as free text                | No lookup tables or admin screens to build; filter options come from `SELECT DISTINCT`           | Typos create new departments; the form suggests existing values to reduce this |
| Optimistic concurrency with a `version` column       | Two HR users editing the same person get a clear 409 instead of losing an update                 | Clients must send the version and handle the conflict                          |

## Engineering

| Decision                                               | Why                                                                                        | Cost                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Factory functions instead of classes or a DI container | Dependencies are explicit and tests can pass an in-memory database and a fixed clock       | A little wiring code in `app.ts`                                                                      |
| Tiny JSON-lines logger instead of a logging library    | One line per request and per error is all we need                                          | No log levels or redaction features                                                                   |
| Types duplicated between client and server             | Avoids a shared package and build step for a small API                                     | Changes must be made in two places; tests on both sides catch drift                                   |
| Plain MUI boxes for charts                             | No charting dependency; each bar is keyboard- and screen-reader-accessible                 | Less polish than a charting library (no axes or animations)                                           |
| One bundle for the client                              | Simple build and deploy                                                                    | 218 KB gzipped on first load, mostly MUI                                                              |
| Express serves the built client                        | One service to deploy, no CORS                                                             | API and static files scale together                                                                   |
| Deterministic seed that wipes and reinserts            | Same data every time, which makes demos and debugging repeatable                           | Running `npm run seed` on a real database would delete it; only `SEED_ON_EMPTY` is safe in production |
| better-sqlite3 12 rather than 13                       | Version 12 downloads a prebuilt binary; 13 tried to compile from source on a clean install | We stay one major version behind until that is fixed upstream                                         |
