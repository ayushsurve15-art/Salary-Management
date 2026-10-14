# Salary Management

Web-based employee salary management for HR teams: employee records, salary history and
organisation-wide pay insights across countries, departments and job titles.

Full documentation lands with the implementation. See [docs/](docs/) for the requirements,
design and architecture notes.

## Workspaces

- `server/` — Node.js + TypeScript API (Express, SQLite)
- `client/` — React + TypeScript single-page app (Vite)

## Scripts

| Command             | What it does                             |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Runs the API and the web client together |
| `npm run build`     | Builds both workspaces                   |
| `npm start`         | Starts the built API                     |
| `npm run seed`      | Seeds the database                       |
| `npm test`          | Runs all unit tests                      |
| `npm run lint`      | Lints the repository                     |
| `npm run typecheck` | Type-checks both workspaces              |
