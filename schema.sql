-- ============================================================================
-- Enterprise HRMS, Geo-Attendance, Leave & Payroll Suite (tpl-lerp-hrms-payroll)
-- Movement R: Modern People-Ops Attendance HeatGrid & Statutory Payslip
-- Database Relational Schema (SQLite / Cloudflare D1)
-- ============================================================================

DROP TABLE IF EXISTS payslips;
DROP TABLE IF EXISTS payroll_batches;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS leave_balances;
DROP TABLE IF EXISTS leave_types;
DROP TABLE IF EXISTS attendance_logs;
DROP TABLE IF EXISTS salary_structures;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS designations;
DROP TABLE IF EXISTS departments;

-- 1. Departments
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  head_of_dept TEXT
);

-- 2. Designations & Organizational Grades
CREATE TABLE IF NOT EXISTS designations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  department_id TEXT NOT NULL REFERENCES departments(id),
  grade TEXT NOT NULL
);

-- 3. Core Employees Master
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  emp_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  designation_id TEXT NOT NULL REFERENCES designations(id),
  department_id TEXT NOT NULL REFERENCES departments(id),
  date_of_joining TEXT NOT NULL,
  pan TEXT NOT NULL,
  uan TEXT NOT NULL,
  bank_account_no TEXT NOT NULL,
  bank_ifsc TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

-- 4. Monthly Indian Statutory Salary Structures
CREATE TABLE IF NOT EXISTS salary_structures (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  basic_monthly REAL NOT NULL,
  hra_monthly REAL NOT NULL,
  special_allowance REAL NOT NULL,
  pf_opt_in INTEGER NOT NULL DEFAULT 1,
  esic_eligible INTEGER NOT NULL DEFAULT 0,
  pt_slab_state TEXT NOT NULL DEFAULT 'KL',
  effective_from TEXT NOT NULL
);

-- 5. Geofenced Clock-In Attendance Logs
CREATE TABLE IF NOT EXISTS attendance_logs (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  date TEXT NOT NULL,
  clock_in TEXT,
  clock_out TEXT,
  total_hours REAL,
  status TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  geofence_verified INTEGER DEFAULT 1,
  ip_address TEXT
);

-- 6. Leave Types Master
CREATE TABLE IF NOT EXISTS leave_types (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  annual_allocation INTEGER NOT NULL,
  is_carry_forward INTEGER NOT NULL DEFAULT 1
);

-- 7. Leave Balances Ledger
CREATE TABLE IF NOT EXISTS leave_balances (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  leave_type_id TEXT NOT NULL REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  allocated REAL NOT NULL,
  used REAL NOT NULL,
  pending REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL
);

-- 8. Leave Requests & Approval Desk
CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  request_code TEXT NOT NULL UNIQUE,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  leave_type_id TEXT NOT NULL REFERENCES leave_types(id),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_days REAL NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  approved_by TEXT,
  approved_at TEXT
);

-- 9. Monthly Payroll Batches
CREATE TABLE IF NOT EXISTS payroll_batches (
  id TEXT PRIMARY KEY,
  batch_code TEXT NOT NULL UNIQUE,
  month_year TEXT NOT NULL,
  total_gross REAL NOT NULL,
  total_deductions REAL NOT NULL,
  total_net REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PROCESSED',
  processed_at TEXT NOT NULL,
  processed_by TEXT NOT NULL
);

-- 10. Form-16 Statutory Payslips
CREATE TABLE IF NOT EXISTS payslips (
  id TEXT PRIMARY KEY,
  payslip_number TEXT NOT NULL UNIQUE,
  payroll_batch_id TEXT NOT NULL REFERENCES payroll_batches(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  month_year TEXT NOT NULL,
  basic_earned REAL NOT NULL,
  hra_earned REAL NOT NULL,
  special_earned REAL NOT NULL,
  gross_earnings REAL NOT NULL,
  epf_employee REAL NOT NULL,
  epf_employer REAL NOT NULL,
  esic_employee REAL NOT NULL,
  esic_employer REAL NOT NULL,
  professional_tax REAL NOT NULL,
  tds REAL NOT NULL,
  total_deductions REAL NOT NULL,
  net_pay REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'ISSUED'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_emp_code ON employees(emp_code);
CREATE INDEX IF NOT EXISTS idx_att_date ON attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_att_emp_date ON attendance_logs(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_req_emp ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslip_emp_month ON payslips(employee_id, month_year);
