# Requirements

## Goal

Replace the HR team's Excel workbook with a web app where an HR Manager can maintain salary data
for about 10,000 employees across several countries, and answer "how does the organisation pay
people?" without building pivot tables by hand.

## User

One persona: the **HR Manager**. They keep employee records current, apply salary changes, and
are asked by leadership to explain pay by country, department and role. They are comfortable with
spreadsheets, not with SQL.

## Core features

1. **Employee list.** Server-side pagination and sorting; search by name or email; filters for
   country, department, job title and salary range. Every interaction stays under a second at
   10,000 rows.
2. **Create, edit and delete employees,** with validation that matches between UI and API
   (required fields, valid email unique regardless of case, positive salary within a
   sane ceiling, a supported currency). Concurrent edits are detected rather than silently
   overwritten.
3. **Salary changes** recorded with an effective date and a reason. Each employee has a salary
   history, newest first. An effective date cannot precede the hire date.
4. **Insights dashboard.** Per country: headcount, min, max, average and median salary in local
   currency. The same breakdown per department and per job title, a salary distribution in bands,
   and top and bottom earners.

## Assumptions

- Each employee has exactly one current salary, paid in the currency of their country.
- Money is stored as integer minor units with an ISO 4217 currency code.
- Amounts in different currencies are never added, averaged or compared. Every aggregate is grouped
  by currency, and rankings such as top earners are per currency.
- The data set is one organisation of roughly 10,000 employees, so a single SQLite file is enough.

## Non-goals, and why

| Left out                       | Reasoning                                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication and roles       | One persona with full access. Auth is a solved problem that would add setup without showing product thinking; it would sit in front of the API. |
| Payroll, tax and deductions    | A different product with country-specific legal rules. We manage gross salary, not pay runs.                                                    |
| Live FX conversion             | Rates change daily and would make insights silently drift. Reporting in local currency is accurate and honest.                                  |
| Bonuses, equity and allowances | Adds compensation types without changing the core workflow. Base salary answers the stated question.                                            |
| Approval workflows             | Needs multiple personas and notifications. Our single HR Manager applies changes directly.                                                      |
| Multi-tenancy                  | One organisation. Tenancy would touch every query for no user benefit.                                                                          |
| Audit UI beyond salary history | Salary history is the audit trail HR asked for. A general change log is out of scope.                                                           |
| Bulk import/export             | Useful for migrating from Excel, but the seed covers demo data. A natural next step.                                                            |

## Success criteria

- The HR Manager can find any employee, change their salary and see the history in a few clicks.
- The dashboard answers pay questions per country, department and role without exporting data.
- The app runs as one deployable service with 10,000 seeded employees and stays responsive.
