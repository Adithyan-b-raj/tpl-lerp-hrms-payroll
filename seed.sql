-- ============================================================================
-- Enterprise HRMS, Geo-Attendance, Leave & Payroll Suite (tpl-lerp-hrms-payroll)
-- Comprehensive Enterprise Seed Data
-- ============================================================================

-- 1. Departments
INSERT OR REPLACE INTO departments (id, code, name, head_of_dept) VALUES
('dept-eng', 'ENG', 'Engineering & Cloud Platform', 'Adithyan Raj'),
('dept-prod', 'PROD', 'Product Architecture & UX', 'Priya Nair'),
('dept-hr', 'HR', 'People Operations & Culture', 'Sneha Nambiar'),
('dept-fin', 'FIN', 'Finance & Statutory Treasury', 'Ananya Varma'),
('dept-ops', 'OPS', 'Global Operations & Support', 'Rohit Shenoy');

-- 2. Designations & Organizational Grades
INSERT OR REPLACE INTO designations (id, title, department_id, grade) VALUES
('desig-arch', 'Principal Systems Architect', 'dept-eng', 'L6'),
('desig-vpprod', 'VP of Product & Design', 'dept-prod', 'L6'),
('desig-lead', 'Engineering Lead - Cloud Core', 'dept-eng', 'L5'),
('desig-hrspec', 'Senior People-Ops Specialist', 'dept-hr', 'L4'),
('desig-srfe', 'Senior Frontend Engineer', 'dept-eng', 'L4'),
('desig-fc', 'Financial Controller', 'dept-fin', 'L5'),
('desig-opsmgr', 'Operations & Logistics Manager', 'dept-ops', 'L4'),
('desig-qa', 'Junior QA & DevOps Associate', 'dept-eng', 'L2'),
('desig-support', 'Technical Support Engineer', 'dept-ops', 'L2');

-- 3. Core Employees Master (9 Diverse Profiles)
INSERT OR REPLACE INTO employees (id, emp_code, first_name, last_name, email, phone, designation_id, department_id, date_of_joining, pan, uan, bank_account_no, bank_ifsc, bank_name, status) VALUES
('emp-1001', 'EMP-1001', 'Adithyan', 'Raj', 'adithyan.raj@pulsehrms.io', '+919847011001', 'desig-arch', 'dept-eng', '2021-03-01', 'AAAPR1234K', '101029384756', '50100492817441', 'HDFC0001242', 'HDFC Bank', 'ACTIVE'),
('emp-1002', 'EMP-1002', 'Priya', 'Nair', 'priya.nair@pulsehrms.io', '+919847011002', 'desig-vpprod', 'dept-prod', '2021-08-15', 'BNNPN5678M', '101083746251', '60200849201934', 'ICIC0000184', 'ICICI Bank', 'ACTIVE'),
('emp-1003', 'EMP-1003', 'Rahul', 'Menon', 'rahul.menon@pulsehrms.io', '+919847011003', 'desig-lead', 'dept-eng', '2022-01-10', 'CKLPM9012Q', '101037461948', '00129482019482', 'SBIN0007421', 'State Bank of India', 'ACTIVE'),
('emp-1004', 'EMP-1004', 'Sneha', 'Nambiar', 'sneha.nambiar@pulsehrms.io', '+919847011004', 'desig-hrspec', 'dept-hr', '2022-06-01', 'DFGSN3456R', '101094837261', '91827402918471', 'UTIB0000452', 'Axis Bank', 'ACTIVE'),
('emp-1005', 'EMP-1005', 'Karthik', 'Warrier', 'karthik.warrier@pulsehrms.io', '+919847011005', 'desig-srfe', 'dept-eng', '2022-11-15', 'EQKPW7890S', '101058372910', '32948201948201', 'KKBK0008291', 'Kotak Mahindra Bank', 'ACTIVE'),
('emp-1006', 'EMP-1006', 'Ananya', 'Varma', 'ananya.varma@pulsehrms.io', '+919847011006', 'desig-fc', 'dept-fin', '2023-02-01', 'FTAVP2345T', '101074628193', '48201948201948', 'HDFC0000240', 'HDFC Bank', 'ACTIVE'),
('emp-1007', 'EMP-1007', 'Rohit', 'Shenoy', 'rohit.shenoy@pulsehrms.io', '+919847011007', 'desig-opsmgr', 'dept-ops', '2023-05-10', 'GYPRS6789U', '101083920194', '58291048201948', 'FDRL0001392', 'Federal Bank', 'ACTIVE'),
('emp-1008', 'EMP-1008', 'Kavya', 'Krishnan', 'kavya.krishnan@pulsehrms.io', '+919847011008', 'desig-qa', 'dept-eng', '2024-01-15', 'HZKKP1234V', '101092837461', '68291048291029', 'SBIN0008432', 'State Bank of India', 'ACTIVE'),
('emp-1009', 'EMP-1009', 'Deepak', 'Pillai', 'deepak.pillai@pulsehrms.io', '+919847011009', 'desig-support', 'dept-ops', '2024-04-01', 'IZDPP5678W', '101038291048', '78291048201934', 'HDFC0001242', 'HDFC Bank', 'ACTIVE');

-- 4. Indian Statutory Salary Structures
-- EMP-1008 has Gross <= ₹21,000 (ESIC Eligible: 0.75% employee + 3.25% employer)
INSERT OR REPLACE INTO salary_structures (id, employee_id, basic_monthly, hra_monthly, special_allowance, pf_opt_in, esic_eligible, pt_slab_state, effective_from) VALUES
('sal-1001', 'emp-1001', 85000.0, 42500.0, 42500.0, 1, 0, 'KL', '2026-04-01'),
('sal-1002', 'emp-1002', 80000.0, 40000.0, 40000.0, 1, 0, 'KL', '2026-04-01'),
('sal-1003', 'emp-1003', 65000.0, 32500.0, 32500.0, 1, 0, 'KL', '2026-04-01'),
('sal-1004', 'emp-1004', 42000.0, 21000.0, 17000.0, 1, 0, 'KL', '2026-04-01'),
('sal-1005', 'emp-1005', 50000.0, 25000.0, 25000.0, 1, 0, 'KL', '2026-04-01'),
('sal-1006', 'emp-1006', 60000.0, 30000.0, 30000.0, 1, 0, 'KL', '2026-04-01'),
('sal-1007', 'emp-1007', 38000.0, 19000.0, 18000.0, 1, 0, 'KL', '2026-04-01'),
('sal-1008', 'emp-1008', 14000.0, 4000.0, 2500.0, 1, 1, 'KL', '2026-04-01'),
('sal-1009', 'emp-1009', 18000.0, 9000.0, 8000.0, 1, 0, 'KL', '2026-04-01');

-- 5. Leave Types
INSERT OR REPLACE INTO leave_types (id, code, name, annual_allocation, is_carry_forward) VALUES
('lt-al', 'AL', 'Annual / Privilege Leave', 18, 1),
('lt-sl', 'SL', 'Sick & Medical Leave', 10, 1),
('lt-cl', 'CL', 'Casual Leave', 6, 0);

-- 6. Leave Balances for 2026
INSERT OR REPLACE INTO leave_balances (id, employee_id, leave_type_id, year, allocated, used, pending, balance) VALUES
('bal-1001-al', 'emp-1001', 'lt-al', 2026, 18.0, 4.0, 0.0, 14.0),
('bal-1001-sl', 'emp-1001', 'lt-sl', 2026, 10.0, 3.0, 0.0, 7.0),
('bal-1001-cl', 'emp-1001', 'lt-cl', 2026, 6.0, 2.0, 0.0, 4.0),

('bal-1002-al', 'emp-1002', 'lt-al', 2026, 18.0, 3.0, 0.0, 15.0),
('bal-1002-sl', 'emp-1002', 'lt-sl', 2026, 10.0, 1.0, 0.0, 9.0),
('bal-1002-cl', 'emp-1002', 'lt-cl', 2026, 6.0, 1.0, 0.0, 5.0),

('bal-1003-al', 'emp-1003', 'lt-al', 2026, 18.0, 5.0, 0.0, 13.0),
('bal-1003-sl', 'emp-1003', 'lt-sl', 2026, 10.0, 2.0, 2.0, 6.0),
('bal-1003-cl', 'emp-1003', 'lt-cl', 2026, 6.0, 2.0, 0.0, 4.0),

('bal-1004-al', 'emp-1004', 'lt-al', 2026, 18.0, 2.0, 3.0, 13.0),
('bal-1004-sl', 'emp-1004', 'lt-sl', 2026, 10.0, 1.0, 0.0, 9.0),
('bal-1004-cl', 'emp-1004', 'lt-cl', 2026, 6.0, 1.0, 0.0, 5.0),

('bal-1005-al', 'emp-1005', 'lt-al', 2026, 18.0, 6.0, 0.0, 12.0),
('bal-1005-sl', 'emp-1005', 'lt-sl', 2026, 10.0, 2.0, 0.0, 8.0),
('bal-1005-cl', 'emp-1005', 'lt-cl', 2026, 6.0, 3.0, 0.0, 3.0),

('bal-1006-al', 'emp-1006', 'lt-al', 2026, 18.0, 3.0, 0.0, 15.0),
('bal-1006-sl', 'emp-1006', 'lt-sl', 2026, 10.0, 0.0, 0.0, 10.0),
('bal-1006-cl', 'emp-1006', 'lt-cl', 2026, 6.0, 2.0, 0.0, 4.0),

('bal-1007-al', 'emp-1007', 'lt-al', 2026, 18.0, 4.0, 0.0, 14.0),
('bal-1007-sl', 'emp-1007', 'lt-sl', 2026, 10.0, 2.0, 0.0, 8.0),
('bal-1007-cl', 'emp-1007', 'lt-cl', 2026, 6.0, 1.0, 0.0, 5.0),

('bal-1008-al', 'emp-1008', 'lt-al', 2026, 18.0, 2.0, 0.0, 16.0),
('bal-1008-sl', 'emp-1008', 'lt-sl', 2026, 10.0, 1.0, 0.0, 9.0),
('bal-1008-cl', 'emp-1008', 'lt-cl', 2026, 6.0, 1.0, 0.0, 5.0),

('bal-1009-al', 'emp-1009', 'lt-al', 2026, 18.0, 1.0, 0.0, 17.0),
('bal-1009-sl', 'emp-1009', 'lt-sl', 2026, 10.0, 0.0, 0.0, 10.0),
('bal-1009-cl', 'emp-1009', 'lt-cl', 2026, 6.0, 2.0, 0.0, 4.0);

-- 7. Leave Requests (Including Pending queue for Admin Approval)
INSERT OR REPLACE INTO leave_requests (id, request_code, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_by, approved_at) VALUES
('lr-101', 'LR-2026-101', 'emp-1003', 'lt-sl', '2026-11-04', '2026-11-05', 2.0, 'Scheduled spine MRI and physiotherapy session', 'PENDING', NULL, NULL),
('lr-102', 'LR-2026-102', 'emp-1004', 'lt-al', '2026-11-18', '2026-11-20', 3.0, 'Family wedding in Kannur (elder brother marriage)', 'PENDING', NULL, NULL),
('lr-103', 'LR-2026-103', 'emp-1005', 'lt-cl', '2026-10-10', '2026-10-10', 1.0, 'Personal banking & passport renewal appointment', 'APPROVED', 'emp-1004', '2026-10-08 14:20:00'),
('lr-104', 'LR-2026-104', 'emp-1008', 'lt-sl', '2026-10-22', '2026-10-22', 1.0, 'Viral flu recuperation and physician rest', 'APPROVED', 'emp-1004', '2026-10-21 18:30:00');

-- 8. Attendance Logs (Full 30-day History for October 2026)
-- Kochi HQ Beacon: [9.9312° N, 76.2673° E]
-- 2026-10-01 to 2026-10-30
-- Weekends in Oct 2026: Oct 3, 4, 10, 11, 17, 18, 24, 25, 31
INSERT OR REPLACE INTO attendance_logs (id, employee_id, date, clock_in, clock_out, total_hours, status, latitude, longitude, geofence_verified, ip_address) VALUES
-- EMP-1001
('att-1001-01', 'emp-1001', '2026-10-01', '09:12:15', '18:15:30', 9.05, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-02', 'emp-1001', '2026-10-02', '09:14:02', '18:10:45', 8.94, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-03', 'emp-1001', '2026-10-03', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1001-04', 'emp-1001', '2026-10-04', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1001-05', 'emp-1001', '2026-10-05', '09:18:22', '18:22:10', 9.06, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-06', 'emp-1001', '2026-10-06', '09:48:10', '18:45:00', 8.95, 'LATE', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-07', 'emp-1001', '2026-10-07', '09:10:00', '18:15:00', 9.08, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-08', 'emp-1001', '2026-10-08', '09:05:40', '18:30:15', 9.41, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-09', 'emp-1001', '2026-10-09', '09:12:00', '17:45:00', 8.55, 'WFH', 9.9816, 76.2999, 0, '122.164.21.84'),
('att-1001-10', 'emp-1001', '2026-10-10', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1001-11', 'emp-1001', '2026-10-11', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1001-12', 'emp-1001', '2026-10-12', '09:15:20', '18:20:00', 9.08, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-13', 'emp-1001', '2026-10-13', '09:11:45', '18:18:10', 9.11, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-14', 'emp-1001', '2026-10-14', '09:20:10', '18:35:40', 9.26, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-15', 'emp-1001', '2026-10-15', '09:10:00', '18:15:00', 9.08, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-16', 'emp-1001', '2026-10-16', '09:12:30', '18:10:00', 8.96, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-17', 'emp-1001', '2026-10-17', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1001-18', 'emp-1001', '2026-10-18', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1001-19', 'emp-1001', '2026-10-19', '09:08:15', '18:15:20', 9.12, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-20', 'emp-1001', '2026-10-20', '09:15:00', '18:25:00', 9.17, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-21', 'emp-1001', '2026-10-21', '09:11:30', '18:20:10', 9.15, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-22', 'emp-1001', '2026-10-22', '09:14:00', '18:15:00', 9.02, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-23', 'emp-1001', '2026-10-23', '09:09:40', '18:12:00', 9.04, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-24', 'emp-1001', '2026-10-24', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1001-25', 'emp-1001', '2026-10-25', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1001-26', 'emp-1001', '2026-10-26', '09:16:10', '18:30:00', 9.23, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-27', 'emp-1001', '2026-10-27', '09:10:45', '18:15:10', 9.07, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-28', 'emp-1001', '2026-10-28', '09:12:00', '18:10:00', 8.97, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-29', 'emp-1001', '2026-10-29', '09:52:10', '18:45:00', 8.88, 'LATE', 9.9312, 76.2673, 1, '10.14.20.101'),
('att-1001-30', 'emp-1001', '2026-10-30', '09:10:00', '18:05:00', 8.92, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.101'),

-- EMP-1005 (Karthik Warrier - has an approved leave on Oct 10, late on Oct 8, etc.)
('att-1005-01', 'emp-1005', '2026-10-01', '09:10:00', '18:15:00', 9.08, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-02', 'emp-1005', '2026-10-02', '09:12:00', '18:10:00', 8.97, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-03', 'emp-1005', '2026-10-03', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1005-04', 'emp-1005', '2026-10-04', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1005-05', 'emp-1005', '2026-10-05', '09:15:00', '18:20:00', 9.08, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-06', 'emp-1005', '2026-10-06', '09:08:00', '18:15:00', 9.12, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-07', 'emp-1005', '2026-10-07', '09:22:00', '18:30:00', 9.13, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-08', 'emp-1005', '2026-10-08', '09:55:00', '18:40:00', 8.75, 'LATE', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-09', 'emp-1005', '2026-10-09', '09:10:00', '18:00:00', 8.83, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-10', 'emp-1005', '2026-10-10', NULL, NULL, 0.00, 'APPROVED_LEAVE', NULL, NULL, 0, NULL),
('att-1005-11', 'emp-1005', '2026-10-11', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1005-12', 'emp-1005', '2026-10-12', '09:10:00', '18:15:00', 9.08, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-13', 'emp-1005', '2026-10-13', '09:15:00', '18:10:00', 8.92, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-14', 'emp-1005', '2026-10-14', '09:05:00', '18:25:00', 9.33, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-15', 'emp-1005', '2026-10-15', '09:12:00', '18:15:00', 9.05, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-16', 'emp-1005', '2026-10-16', '09:10:00', '17:50:00', 8.67, 'WFH', 9.9723, 76.2812, 0, '122.164.21.90'),
('att-1005-17', 'emp-1005', '2026-10-17', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1005-18', 'emp-1005', '2026-10-18', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1005-19', 'emp-1005', '2026-10-19', '09:11:00', '18:15:00', 9.07, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-20', 'emp-1005', '2026-10-20', '09:14:00', '18:20:00', 9.10, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-21', 'emp-1005', '2026-10-21', '09:15:00', '18:15:00', 9.00, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-22', 'emp-1005', '2026-10-22', '09:10:00', '18:10:00', 9.00, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-23', 'emp-1005', '2026-10-23', '09:49:00', '18:40:00', 8.85, 'LATE', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-24', 'emp-1005', '2026-10-24', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1005-25', 'emp-1005', '2026-10-25', NULL, NULL, 0.00, 'WEEKEND', NULL, NULL, 0, NULL),
('att-1005-26', 'emp-1005', '2026-10-26', '09:09:00', '18:15:00', 9.10, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-27', 'emp-1005', '2026-10-27', '09:12:00', '18:18:00', 9.10, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-28', 'emp-1005', '2026-10-28', '09:15:00', '18:20:00', 9.08, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-29', 'emp-1005', '2026-10-29', '09:11:00', '18:15:00', 9.07, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105'),
('att-1005-30', 'emp-1005', '2026-10-30', '09:10:00', '18:05:00', 8.92, 'PRESENT', 9.9312, 76.2673, 1, '10.14.20.105');

-- 9. Monthly Payroll Batches (September 2026 & October 2026)
INSERT OR REPLACE INTO payroll_batches (id, batch_code, month_year, total_gross, total_deductions, total_net, status, processed_at, processed_by) VALUES
('pb-2026-09', 'PAY-2026-09', 'September 2026', 890500.0, 87515.75, 802984.25, 'DISBURSED', '2026-09-30 17:30:00', 'Sneha Nambiar (HR Director)'),
('pb-2026-10', 'PAY-2026-10', 'October 2026', 890500.0, 87515.75, 802984.25, 'PROCESSED', '2026-10-31 16:45:00', 'Sneha Nambiar (HR Director)');

-- 10. Form-16 Statutory Payslips for October 2026
-- EPF: 12% of Basic
-- ESIC: 0.75% of Gross (only for emp-1008 where Gross <= 21,000)
-- PT: ₹208/month for Kerala
-- TDS: New Tax regime estimated monthly deduction
INSERT OR REPLACE INTO payslips (id, payslip_number, payroll_batch_id, employee_id, month_year, basic_earned, hra_earned, special_earned, gross_earnings, epf_employee, epf_employer, esic_employee, esic_employer, professional_tax, tds, total_deductions, net_pay, status) VALUES
('ps-2026-10-1001', 'PS-2026-10-1001', 'pb-2026-10', 'emp-1001', 'October 2026', 85000.0, 42500.0, 42500.0, 170000.0, 10200.0, 10200.0, 0.0, 0.0, 208.0, 15800.0, 26208.0, 143792.0, 'ISSUED'),
('ps-2026-10-1002', 'PS-2026-10-1002', 'pb-2026-10', 'emp-1002', 'October 2026', 80000.0, 40000.0, 40000.0, 160000.0, 9600.0, 9600.0, 0.0, 0.0, 208.0, 14200.0, 24008.0, 135992.0, 'ISSUED'),
('ps-2026-10-1003', 'PS-2026-10-1003', 'pb-2026-10', 'emp-1003', 'October 2026', 65000.0, 32500.0, 32500.0, 130000.0, 7800.0, 7800.0, 0.0, 0.0, 208.0, 9500.0, 17508.0, 112492.0, 'ISSUED'),
('ps-2026-10-1004', 'PS-2026-10-1004', 'pb-2026-10', 'emp-1004', 'October 2026', 42000.0, 21000.0, 17000.0, 80000.0, 5040.0, 5040.0, 0.0, 0.0, 208.0, 2800.0, 8048.0, 71952.0, 'ISSUED'),
('ps-2026-10-1005', 'PS-2026-10-1005', 'pb-2026-10', 'emp-1005', 'October 2026', 50000.0, 25000.0, 25000.0, 100000.0, 6000.0, 6000.0, 0.0, 0.0, 208.0, 5000.0, 11208.0, 88792.0, 'ISSUED'),
('ps-2026-10-1006', 'PS-2026-10-1006', 'pb-2026-10', 'emp-1006', 'October 2026', 60000.0, 30000.0, 30000.0, 120000.0, 7200.0, 7200.0, 0.0, 0.0, 208.0, 8000.0, 15408.0, 104592.0, 'ISSUED'),
('ps-2026-10-1007', 'PS-2026-10-1007', 'pb-2026-10', 'emp-1007', 'October 2026', 38000.0, 19000.0, 18000.0, 75000.0, 4560.0, 4560.0, 0.0, 0.0, 208.0, 2200.0, 6968.0, 68032.0, 'ISSUED'),
('ps-2026-10-1008', 'PS-2026-10-1008', 'pb-2026-10', 'emp-1008', 'October 2026', 14000.0, 4000.0, 2500.0, 20500.0, 1680.0, 1680.0, 153.75, 666.25, 208.0, 0.0, 2041.75, 18458.25, 'ISSUED'),
('ps-2026-10-1009', 'PS-2026-10-1009', 'pb-2026-10', 'emp-1009', 'October 2026', 18000.0, 9000.0, 8000.0, 35000.0, 2160.0, 2160.0, 0.0, 0.0, 208.0, 0.0, 2368.0, 32632.0, 'ISSUED');
