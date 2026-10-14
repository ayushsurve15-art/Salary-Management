# Performance

Everything was measured on a Windows 11 laptop with Node 24, against the seeded database of
10,000 employees and 26,536 salary history rows. The numbers are small enough that the main
point is the reasoning; they show there is plenty of headroom at this size.

## Seed

| Run                                                             | Time                         |
| --------------------------------------------------------------- | ---------------------------- |
| `npm run seed` (generate 10,000 employees, insert with history) | 0.37–0.67 s across five runs |

The seed generates everything in memory first, then inserts in a single transaction with two
prepared statements. Outside a transaction, each of the ~36,500 inserts would be its own commit,
which is far slower.

## SQL queries

Average of 50 runs of each list query against SQLite directly, with the plan SQLite chose.

| Query                                 | Time    | Plan                                             |
| ------------------------------------- | ------- | ------------------------------------------------ |
| Default list (name sort, page 1)      | 0.05 ms | Walks `idx_employees_name`                       |
| Name sort, last page (offset 9,975)   | 0.28 ms | Walks `idx_employees_name`                       |
| Salary sort, descending               | 0.04 ms | Walks `idx_employees_currency_salary`            |
| Country filter, hire date sort        | 0.74 ms | Seeks `idx_employees_country`, sorts ~2,500 rows |
| Currency + salary range               | 0.65 ms | Range seek on `idx_employees_currency_salary`    |
| Search "patel" (substring)            | 3.1 ms  | Full scan; `LIKE '%…%'` cannot use an index      |
| `COUNT(*)` for search                 | 2.7 ms  | Full scan                                        |
| Insights: per-country aggregates      | 6.0 ms  | Scan with a temp B-tree for `GROUP BY`           |
| Insights: all salaries in group order | 9.1 ms  | Scan plus sort                                   |

One query changed because of this measurement. Salary sort used to order by `currency ASC,
salary_minor DESC`; the mixed directions stopped SQLite from using the `(currency,
salary_minor)` index and it sorted 10,000 rows in a temp B-tree (1.5 ms). Ordering currency in
the same direction as salary lets it walk the index backwards (0.04 ms).

## API, end to end

Median of five requests with `curl` against the production build on localhost, including HTTP,
validation and JSON serialisation.

| Endpoint                                                             | Median |
| -------------------------------------------------------------------- | ------ |
| `GET /api/employees` (first page)                                    | 9 ms   |
| `GET /api/employees?page=400`                                        | 3 ms   |
| `GET /api/employees?sort=salary&order=desc`                          | 2 ms   |
| `GET /api/employees?search=patel`                                    | 10 ms  |
| `GET /api/employees?country=US&department=Engineering&sort=hireDate` | 7 ms   |
| `GET /api/employees?currency=USD&minSalary=…&maxSalary=…`            | 3 ms   |
| `GET /api/meta`                                                      | 3 ms   |
| `GET /api/insights/countries`                                        | 29 ms  |
| `GET /api/insights/groups?by=department&currency=USD`                | 10 ms  |
| `GET /api/insights/groups?by=jobTitle&currency=INR`                  | 6 ms   |
| `GET /api/insights/distribution?currency=USD`                        | 4 ms   |
| `GET /api/insights/earners?currency=EUR`                             | 4 ms   |

A page of 25 employees is about 8 KB of JSON.

## Index reasoning

Every column the list can filter or sort on has an index, and each index earns its place:

- `(last_name, first_name)` serves the default sort, so the first screen never sorts.
- `email` is unique with `NOCASE`, which enforces case-insensitive uniqueness and serves the email
  sort.
- `country`, `department` and `job_title` serve equality filters. Department and job title
  indexes also make the `SELECT DISTINCT` behind the filter dropdowns cheap.
- `(currency, salary_minor)` serves the salary range filter and the salary sort. Per-currency
  insights read it in order too: the distribution reads one currency's salaries already sorted,
  and top or bottom earners stop after a few rows.
- `hire_date` serves the hire date sort.
- `salary_history (employee_id, effective_date, id)` serves the history list and the "latest
  entry" lookup after a back-dated change.

Writes pay for these indexes, but HR edits a handful of records at a time, so reads matter far
more than writes here.

## What else keeps it fast

- Page size is capped at 100, so no request can ask for the whole table.
- Statements are prepared once per repository and reused.
- WAL mode lets reads carry on while a write commits.
- The client debounces search by 300 ms and keeps the previous page on screen while the next one
  loads, so typing and paging feel instant even with a slower network.
- TanStack Query caches pages for 30 seconds, so going back to a page you just saw does not
  refetch.

## Where it would need work

| Growth                  | What would change first                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 100,000+ employees      | Substring search would move to FTS5; insights would cache per-currency results or keep running aggregates; deep pages would move to keyset pagination |
| Many concurrent writers | SQLite's single writer becomes the limit; move to Postgres                                                                                            |
| Slow networks           | Turn on gzip for API responses (currently off) and split the client bundle (218 KB gzipped) by route                                                  |
