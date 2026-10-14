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
