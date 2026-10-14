/**
 * Headcount share and a typical annual salary for a mid-level individual contributor, in major
 * units of the local currency. Figures are rough market levels, good enough for demo data.
 */
export const COUNTRY_PROFILES = [
  { country: 'US', weight: 25, baseSalary: 115_000 },
  { country: 'IN', weight: 18, baseSalary: 1_600_000 },
  { country: 'GB', weight: 12, baseSalary: 60_000 },
  { country: 'DE', weight: 10, baseSalary: 65_000 },
  { country: 'CA', weight: 8, baseSalary: 90_000 },
  { country: 'FR', weight: 7, baseSalary: 52_000 },
  { country: 'BR', weight: 6, baseSalary: 130_000 },
  { country: 'JP', weight: 5, baseSalary: 7_000_000 },
  { country: 'AU', weight: 5, baseSalary: 105_000 },
  { country: 'SG', weight: 4, baseSalary: 85_000 },
] as const;

/** Job titles per department, with pay relative to the country's base salary. */
export const DEPARTMENTS = [
  {
    name: 'Engineering',
    weight: 30,
    roles: [
      { title: 'Software Engineer', multiplier: 1.0, weight: 45 },
      { title: 'Senior Software Engineer', multiplier: 1.35, weight: 30 },
      { title: 'QA Engineer', multiplier: 0.85, weight: 12 },
      { title: 'Engineering Manager', multiplier: 1.65, weight: 13 },
    ],
  },
  {
    name: 'Product',
    weight: 8,
    roles: [
      { title: 'Product Manager', multiplier: 1.3, weight: 55 },
      { title: 'Product Designer', multiplier: 1.0, weight: 45 },
    ],
  },
  {
    name: 'Sales',
    weight: 18,
    roles: [
      { title: 'Sales Development Representative', multiplier: 0.6, weight: 35 },
      { title: 'Account Executive', multiplier: 0.9, weight: 45 },
      { title: 'Sales Manager', multiplier: 1.25, weight: 20 },
    ],
  },
  {
    name: 'Marketing',
    weight: 8,
    roles: [
      { title: 'Marketing Specialist', multiplier: 0.75, weight: 65 },
      { title: 'Marketing Manager', multiplier: 1.15, weight: 35 },
    ],
  },
  {
    name: 'Customer Support',
    weight: 16,
    roles: [
      { title: 'Support Specialist', multiplier: 0.55, weight: 80 },
      { title: 'Support Team Lead', multiplier: 0.8, weight: 20 },
    ],
  },
  {
    name: 'Finance',
    weight: 7,
    roles: [
      { title: 'Financial Analyst', multiplier: 0.9, weight: 70 },
      { title: 'Finance Manager', multiplier: 1.3, weight: 30 },
    ],
  },
  {
    name: 'Human Resources',
    weight: 5,
    roles: [
      { title: 'HR Generalist', multiplier: 0.7, weight: 70 },
      { title: 'HR Manager', multiplier: 1.1, weight: 30 },
    ],
  },
  {
    name: 'Operations',
    weight: 8,
    roles: [
      { title: 'Operations Analyst', multiplier: 0.75, weight: 70 },
      { title: 'Operations Manager', multiplier: 1.15, weight: 30 },
    ],
  },
] as const;

// prettier-ignore
export const FIRST_NAMES = [
  'Aarav', 'Abigail', 'Adebayo', 'Aiko', 'Alejandro', 'Amara', 'Ana', 'Anika', 'Arjun', 'Beatriz',
  'Benjamin', 'Camille', 'Carlos', 'Chen', 'Chloe', 'Daniel', 'Diego', 'Elena', 'Emma', 'Ethan',
  'Fatima', 'Felix', 'Gabriel', 'Hana', 'Hannah', 'Hiroshi', 'Isabella', 'Ivan', 'Jack', 'James',
  'Jia', 'Julia', 'Kai', 'Kavya', 'Laura', 'Leon', 'Liam', 'Lucas', 'Maria', 'Mateo', 'Maya',
  'Mei', 'Mohammed', 'Noah', 'Nour', 'Olivia', 'Oliver', 'Priya', 'Rafael', 'Ravi', 'Rohan',
  'Sakura', 'Samuel', 'Sara', 'Sofia', 'Thomas', 'Valentina', 'Wei', 'Yuki', 'Zara',
] as const;

// prettier-ignore
export const LAST_NAMES = [
  'Ahmed', 'Alvarez', 'Anderson', 'Bauer', 'Becker', 'Bernard', 'Brown', 'Campbell', 'Chen',
  'Costa', 'Dubois', 'Fernandes', 'Fischer', 'Garcia', 'Gupta', 'Hoffmann', 'Ito', 'Iyer',
  'Johnson', 'Kato', 'Khan', 'Kim', 'Kumar', 'Lee', 'Lefebvre', 'Li', 'Lopez', 'Martin',
  'Meyer', 'Moreau', 'Murphy', 'Nakamura', 'Nguyen', 'Oliveira', 'Patel', 'Pereira', 'Reddy',
  'Roberts', 'Rodrigues', 'Rossi', 'Sato', 'Schmidt', 'Silva', 'Singh', 'Smith', 'Suzuki',
  'Tan', 'Taylor', 'Thompson', 'Tremblay', 'Wang', 'Weber', 'Williams', 'Wilson', 'Wong',
  'Yamamoto', 'Zhang',
] as const;

export const RAISE_REASONS = [
  { value: 'Annual review', weight: 70 },
  { value: 'Promotion', weight: 15 },
  { value: 'Market adjustment', weight: 15 },
] as const;
