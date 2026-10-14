CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL CHECK (length(first_name) BETWEEN 1 AND 100),
  last_name TEXT NOT NULL CHECK (length(last_name) BETWEEN 1 AND 100),
  email TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(email) BETWEEN 3 AND 254),
  job_title TEXT NOT NULL CHECK (length(job_title) BETWEEN 1 AND 100),
  department TEXT NOT NULL CHECK (length(department) BETWEEN 1 AND 100),
  country TEXT NOT NULL CHECK (length(country) = 2),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  salary_minor INTEGER NOT NULL CHECK (salary_minor > 0),
  hire_date TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_employees_name ON employees (last_name, first_name);
CREATE INDEX idx_employees_country ON employees (country);
CREATE INDEX idx_employees_department ON employees (department);
CREATE INDEX idx_employees_job_title ON employees (job_title);
CREATE INDEX idx_employees_currency_salary ON employees (currency, salary_minor);
CREATE INDEX idx_employees_hire_date ON employees (hire_date);

CREATE TABLE salary_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  salary_minor INTEGER NOT NULL CHECK (salary_minor > 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  effective_date TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 1 AND 500),
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_salary_history_employee ON salary_history (employee_id, effective_date, id);
