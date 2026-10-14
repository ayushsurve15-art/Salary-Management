# Architecture

One Node.js service. In production it serves both the JSON API and the built React app, so the
whole product deploys as a single process with a SQLite file on a persistent disk. In development,
Vite serves the client and proxies `/api` to the server.

```mermaid
flowchart LR
    hr([HR Manager]) --> browser

    subgraph browser [Browser: React SPA]
        pages[Pages<br/>Employees, Detail, Form, Insights]
        query[TanStack Query cache]
        apiClient[Typed API client]
        pages --> query --> apiClient
    end

    apiClient -- "JSON over HTTP /api" --> routes

    subgraph server [Node.js service: Express]
        static[Static files<br/>built client]
        routes[Routes] --> controllers[Controllers<br/>Zod validation]
        controllers --> services[Services<br/>rules, transactions, percentiles]
        services --> repos[Repositories<br/>parameterised SQL]
        errors[Central error handler]
        controllers -. errors .-> errors
        services -. errors .-> errors
    end

    browser -- "GET /" --> static
    repos --> db[(SQLite<br/>WAL, foreign keys)]
    migrations[Versioned SQL migrations] --> db
    seed[Deterministic seed<br/>10,000 employees] --> db
```

## Data model

```mermaid
erDiagram
    employees ||--o{ salary_history : "has"
    employees {
        integer id PK
        text first_name
        text last_name
        text email UK
        text job_title
        text department
        text country
        text currency
        integer salary_minor
        text hire_date
        integer version
    }
    salary_history {
        integer id PK
        integer employee_id FK
        integer salary_minor
        text currency
        text effective_date
        text reason
    }
```

## Request flow: changing a salary

1. The client posts `{ salaryMinor, currency, effectiveDate, reason, version }` to
   `/api/employees/:id/salary-changes`.
2. The controller validates the id and body with Zod.
3. The service opens a transaction, checks the currency and effective date against the employee,
   inserts the history row, recomputes the current salary from history and bumps the version
   (`WHERE id = ? AND version = ?`).
4. A stale version or missing employee throws a domain error, the transaction rolls back and the
   central handler returns a 409 or 404 in the standard error shape.
5. On success the client invalidates the employee, history, list and insights queries.

## Layer rules

- Routes only wire paths to controllers.
- Controllers parse input and shape output; they hold no SQL and no business rules.
- Services own business rules and transactions and depend on repository functions.
- Repositories are the only code that touches the database.
- Shared pure logic (percentiles, bands, money) has no I/O, so it is unit-tested directly.
