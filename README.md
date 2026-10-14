# Salary Management

A web app for an HR Manager who looks after salaries for about 10,000 employees across ten
countries. It replaces a shared Excel workbook: HR can find and edit employees, record salary
changes with a reason and an effective date, and answer "how do we pay people?" by country,
department and job title without building pivot tables.

We kept the scope tight on purpose. The [requirements](docs/requirements.md) explain what is in,
what is out and why.

## Features

- **Employee list** with server-side paging, sorting, search by name or email, and filters for
  country, department, job title and salary range. Every view lives in the URL, so it can be
  bookmarked or shared.
- **Add, edit and delete employees**, with the same validation in the form and the API.
- **Salary changes** with an effective date and a reason, and a full salary history per employee.
  Back-dated changes are allowed; the current salary always reflects the latest effective date.
- **Safe concurrent editing.** If two people edit the same employee, the second save gets a clear
  "changed by someone else" message instead of silently overwriting the first.
- **Insights**: headcount, min, max, average, median and 25th/75th percentiles per country, then
  per department and job title within a currency, a salary histogram, and top and bottom earners.
- **Money done carefully.** Salaries are stored as integer minor units with an ISO 4217 currency
  code. Amounts in different currencies are never added, averaged or compared.

## Tech stack

| Layer    | Choice                                                        |
| -------- | ------------------------------------------------------------- |
| Backend  | Node.js, TypeScript, Express 5, Zod                           |
| Database | SQLite via better-sqlite3, versioned SQL migrations, WAL mode |
| Frontend | React 19, Vite, TypeScript, MUI, React Router, TanStack Query |
| Tests    | Vitest, Supertest, Testing Library                            |
| Tooling  | npm workspaces, ESLint, Prettier, GitHub Actions, Docker      |

## Quick start

You need Node.js 20 or newer (we develop on 22 and 24).

```bash
npm install
npm run seed
npm run dev
```

Then open http://localhost:5173. The API runs on http://localhost:4000 and Vite proxies `/api`
to it. The seed creates 10,000 employees in under a second.

To run it the way production does, as one service on port 4000:

```bash
npm run build
npm start
```

## Scripts

Run these from the repository root.

| Command                           | What it does                                                  |
| --------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                     | Starts the API (with reload) and the Vite dev server together |
| `npm run build`                   | Compiles the server and builds the client                     |
| `npm start`                       | Starts the built server, which also serves the built client   |
| `npm run seed`                    | Wipes the database and seeds 10,000 employees (deterministic) |
| `npm test`                        | Runs the server and client test suites                        |
| `npm run lint`                    | Lints everything with ESLint                                  |
| `npm run typecheck`               | Type-checks both workspaces                                   |
| `npm run format` / `format:check` | Formats with Prettier, or checks formatting                   |

## Configuration

The server reads these environment variables and refuses to start if one is invalid. See
[.env.example](.env.example).

| Variable        | Default          | Meaning                                                              |
| --------------- | ---------------- | -------------------------------------------------------------------- |
| `NODE_ENV`      | `development`    | `development`, `production` or `test`                                |
| `PORT`          | `4000`           | HTTP port                                                            |
| `DATABASE_PATH` | `data/salary.db` | SQLite file, relative to `server/`; the folder is created if missing |
| `SEED_ON_EMPTY` | `false`          | When `true`, seeds 10,000 employees on boot if there are none        |

## API

All endpoints are under `/api` and use JSON. Errors always look like
`{ "error": { "code", "message", "details"? } }` with codes `VALIDATION_ERROR` (400),
`NOT_FOUND` (404), `CONFLICT` (409) and `INTERNAL_ERROR` (500).

| Method | Path                                                 | Purpose                                                                                                                                      |
| ------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/health`                                            | Liveness and database check                                                                                                                  |
| GET    | `/meta`                                              | Countries with currencies, departments and job titles for filters                                                                            |
| GET    | `/employees`                                         | List with `page`, `pageSize` (max 100), `sort`, `order`, `search`, `country`, `department`, `jobTitle`, `currency`, `minSalary`, `maxSalary` |
| POST   | `/employees`                                         | Create an employee and their first salary history entry                                                                                      |
| GET    | `/employees/:id`                                     | One employee                                                                                                                                 |
| PUT    | `/employees/:id`                                     | Edit profile fields; requires the current `version`                                                                                          |
| DELETE | `/employees/:id`                                     | Delete an employee and their history                                                                                                         |
| GET    | `/employees/:id/salary-history`                      | Salary history, newest first                                                                                                                 |
| POST   | `/employees/:id/salary-changes`                      | Change salary; requires the current `version`                                                                                                |
| GET    | `/insights/countries`                                | Pay statistics per country                                                                                                                   |
| GET    | `/insights/groups?by=department\|jobTitle&currency=` | Pay statistics per group, one currency                                                                                                       |
| GET    | `/insights/distribution?currency=&bands=`            | Salary bands for one currency                                                                                                                |
| GET    | `/insights/earners?currency=&limit=`                 | Top and bottom earners for one currency                                                                                                      |

Salaries are integers in minor units (`6500000` with `USD` is $65,000.00; yen has no minor unit).

## Tests

```bash
npm test
```

There are 116 server tests and 67 client tests, and the whole suite runs in about 15 seconds.

- **Server:** validation edge cases, every API endpoint against an in-memory database, the
  percentile and band maths on small fixtures, migrations, config and the seed generator's
  determinism and uniqueness.
- **Client:** money parsing and formatting, URL state, form validation, and the salary dialog,
  filters and list page with the API mocked.

Tests never touch the network or real time. The server takes an injectable clock and the client
fakes only `Date`.

## Seeding

`npm run seed` generates 10,000 employees across ten countries and nine currencies with a seeded
random number generator, so every run produces identical data. Salaries follow a per-country base
and a per-role multiplier, and most employees have a few past raises. It replaces everything in
the database in one transaction, so do not run it against data you want to keep. In production,
use `SEED_ON_EMPTY=true` instead: it only seeds a database with no employees.

## Deployment

The server serves the built client, so the whole app is one container.

**Docker**

```bash
docker build -t salary-management .
docker run -p 4000:4000 -e SEED_ON_EMPTY=true -v salary-data:/app/data salary-management
```

The image runs migrations on start, stores the database in `/app/data` and has a health check on
`/api/health`. Mount a volume there or the data is lost when the container is replaced.

**Render**

[render.yaml](render.yaml) describes a Docker web service with a 1 GB persistent disk at
`/app/data` and `SEED_ON_EMPTY=true`. Push the repository to GitHub, then in Render choose
**New > Blueprint** and pick the repository. Persistent disks need a paid instance type; on the
free tier the app still works but the data resets on every deploy.

**CI** runs on every push and pull request: format check, lint, typecheck, tests, build, and a
Docker image build.

## Project structure

```
├── client/                React app
│   └── src/
│       ├── api/           Typed API client and response types
│       ├── app/           Layout and shell
│       ├── components/    Shared UI pieces
│       ├── features/      employees/ and insights/ pages, hooks and helpers
│       └── lib/           Money and date helpers
├── server/
│   ├── migrations/        Numbered SQL migrations
│   └── src/
│       ├── routes/        URL to controller wiring
│       ├── controllers/   Request parsing and response shaping
│       ├── services/      Business rules and transactions
│       ├── repositories/  All SQL
│       ├── validation/    Zod schemas
│       ├── domain/        Types, countries, statistics
│       ├── seed/          Deterministic data generator
│       └── middleware/    Logging, errors, serving the client
├── docs/                  Requirements, design, architecture, trade-offs, performance, prompt log
├── Dockerfile
└── render.yaml
```

## Documentation

- [Requirements](docs/requirements.md): goal, scope and what we left out
- [Design](docs/design.md): data model, API, money, pagination, percentiles, concurrency
- [Architecture](docs/architecture.md): diagrams and request flow
- [Trade-offs](docs/tradeoffs.md): what each decision costs and when to revisit it
- [Performance](docs/performance.md): measured query and API times, index reasoning
- [Prompt log](docs/prompts.md): what was asked during the build and what was decided

## Known limitations and future work

- **No authentication.** Anyone who can reach the app can change salaries. SSO in front of the
  API is the first thing to add before real use.
- **No currency conversion.** There is no single payroll total across countries, by design.
- **No relocations or scheduled raises.** Country is fixed after hiring and salary changes cannot
  be dated in the future.
- **No bulk import or export.** Moving off Excel would need CSV import.
- **Hard deletes.** Deleted employees and their history are gone for good.
- **SQLite.** Plenty for one organisation of this size, but it has a single writer and needs a
  persistent disk. Postgres is the next step if either becomes a problem.
- **No response compression** and a single 218 KB (gzipped) client bundle.
