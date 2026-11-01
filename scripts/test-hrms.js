/**
 * scripts/test-hrms.js
 * Verification Test Suite for Ticket 6.2:
 * "Enterprise HRMS, Geo-Attendance, Leave & Payroll Suite (tpl-lerp-hrms-payroll)"
 * Movement R: Modern People-Ops Attendance HeatGrid & Statutory Payslip
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================================');
  console.log('🧪 Starting tpl-lerp-hrms-payroll Automated Verification Suite');
  console.log('======================================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Database Relational Schema & Seed Verification
  // --------------------------------------------------------------------------
  console.log('\x1b[36m[Group 1] Database Relational Schema & Seed Completeness\x1b[0m');
  const schemaPath = path.join(rootDir, 'schema.sql');
  const seedPath = path.join(rootDir, 'seed.sql');

  assert(fs.existsSync(schemaPath), 'schema.sql file exists');
  assert(fs.existsSync(seedPath), 'seed.sql file exists');

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const requiredTables = [
    'departments', 'designations', 'employees', 'salary_structures',
    'attendance_logs', 'leave_types', 'leave_balances', 'leave_requests',
    'payroll_batches', 'payslips'
  ];

  requiredTables.forEach((table) => {
    const tablePattern = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`, 'i');
    assert(tablePattern.test(schemaContent), `Schema declares table: ${table}`);
  });

  const seedContent = fs.readFileSync(seedPath, 'utf8');
  assert(seedContent.includes('emp-1001') && seedContent.includes('emp-1008'), 'Seed contains 8+ employee records');
  assert(seedContent.includes('dept-eng') && seedContent.includes('dept-prod') && seedContent.includes('dept-hr'), 'Seed contains cross-functional departments');
  assert(seedContent.includes('2026-10-01') && seedContent.includes('2026-10-30'), 'Seed contains full 30-day attendance history');
  assert(seedContent.includes('9.9312') && seedContent.includes('76.2673'), 'Seed contains Kochi HQ geofence coordinates');
  assert(seedContent.includes('PAY-2026-10'), 'Seed contains pre-calculated October 2026 payroll batch');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Store & V8 Isolate Snapshot Freeze Immunity
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 2] Store & V8 Isolate Snapshot Freeze Immunity\x1b[0m');
  const {
    getStore,
    resetStore,
    getLazyNow,
    getLazyDateString,
    KOCHI_HQ_BEACON,
    calculateDistanceMeters,
    verifyGeofence,
    numberToIndianWords,
    calculateStatutoryBreakdown,
    getEmployees,
    getEmployeeById,
    getAttendanceMatrix,
    recordPunch,
    getLeaveRequests,
    applyLeave,
    updateLeaveStatus,
    runMonthlyPayroll,
    generateNeftDisbursementCsv,
    getForm16Payslip
  } = await import('../functions/api/_store.js');

  const lazyDate = getLazyNow();
  assert(lazyDate.getFullYear() >= 2024, `Lazy date helper returns valid current/future year (got ${lazyDate.getFullYear()})`);
  assert(typeof getLazyDateString() === 'string', 'getLazyDateString returns valid ISO date string');

  const store = getStore();
  assert(Array.isArray(store.employees) && store.employees.length >= 8, `Store initializes at least 8 employees (found ${store.employees.length})`);
  assert(Array.isArray(store.departments) && store.departments.length >= 5, 'Store initializes 5 departments');
  assert(Array.isArray(store.designations) && store.designations.length >= 8, 'Store initializes 8+ designations');
  assert(Array.isArray(store.attendanceLogs) && store.attendanceLogs.length >= 240, `Store contains 240+ 30-day attendance logs (found ${store.attendanceLogs.length})`);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Kochi HQ Geofence Distance & Radar Verification Engine
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 3] Kochi HQ Geofence Distance & Radar Verification\x1b[0m');
  assert(KOCHI_HQ_BEACON.latitude === 9.9312 && KOCHI_HQ_BEACON.longitude === 76.2673, 'Kochi HQ Beacon coordinates configured at [9.9312° N, 76.2673° E]');

  const distZero = calculateDistanceMeters(9.9312, 76.2673, 9.9312, 76.2673);
  assert(distZero === 0, `Exact HQ coordinate distance is 0 meters (got ${distZero}m)`);

  // 100 meters away (approx 0.0009 degrees lat)
  const distClose = calculateDistanceMeters(9.9312, 76.2673, 9.9320, 76.2673);
  assert(distClose > 0 && distClose < 200, `Nearby punch within 200m calculated accurately (got ${distClose}m)`);

  const geoNear = verifyGeofence(9.9320, 76.2673);
  assert(geoNear.verified === true, `Nearby punch within 500m geofence verified: true (distance: ${geoNear.distanceMeters}m)`);

  // Remote location (Bangalore North: 12.9716, 77.5946 - ~360 km away)
  const geoRemote = verifyGeofence(12.9716, 77.5946);
  assert(geoRemote.verified === false, `Remote Bangalore punch flags verified: false (distance: ${Math.round(geoRemote.distanceMeters / 1000)} km)`);

  // Punch in/out action
  const punchInRes = recordPunch('emp-1001', {
    type: 'CLOCK_IN',
    latitude: 9.9312,
    longitude: 76.2673,
    bypassGeofence: false
  });
  assert(punchInRes.action === 'CLOCK_IN', 'recordPunch successfully performs CLOCK_IN');
  assert(punchInRes.geofence.verified === true, 'Punch inside HQ geofence verified');
  assert(punchInRes.status === 'PRESENT', 'Punch status set to PRESENT');

  const punchOutRes = recordPunch('emp-1001', {
    type: 'CLOCK_OUT',
    latitude: 9.9312,
    longitude: 76.2673
  });
  assert(punchOutRes.action === 'CLOCK_OUT', 'recordPunch successfully performs CLOCK_OUT');
  assert(punchOutRes.total_hours >= 0, `Punch out records total hours worked (hours: ${punchOutRes.total_hours})`);

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Indian Statutory Payroll Math & Deductions Engine
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 4] Indian Statutory Payroll Math & Deductions Engine\x1b[0m');

  // Case 1: Senior Architect (EMP-1001: Basic 85k, HRA 42.5k, Special 42.5k = Gross 170k)
  const salArch = { basic_monthly: 85000, hra_monthly: 42500, special_allowance: 42500, pt_slab_state: 'KL' };
  const calcArch = calculateStatutoryBreakdown(salArch);

  assert(calcArch.gross_earnings === 170000, `Senior gross earnings calculated as ₹1,70,000 (got ₹${calcArch.gross_earnings})`);
  assert(calcArch.epf_employee === 10200, `EPF 12% calculated as ₹10,200 (got ₹${calcArch.epf_employee})`);
  assert(calcArch.epf_employer === 10200, 'EPF employer matching contribution is 12%');
  assert(calcArch.esic_employee === 0, `Gross > ₹21,000 correctly exempts from ESIC (got ₹${calcArch.esic_employee})`);
  assert(calcArch.professional_tax === 208, `Kerala Professional Tax calculated at standard ₹208/month (got ₹${calcArch.professional_tax})`);
  assert(calcArch.tds > 0, `New tax regime estimated TDS is calculated (got ₹${calcArch.tds})`);
  assert(calcArch.net_pay === calcArch.gross_earnings - calcArch.total_deductions, 'Net pay equals gross minus total deductions');

  // Case 2: Junior QA (EMP-1008: Basic 14k, HRA 4k, Special 2.5k = Gross 20.5k <= 21k ESIC Eligible!)
  const salQa = { basic_monthly: 14000, hra_monthly: 4000, special_allowance: 2500, pt_slab_state: 'KL' };
  const calcQa = calculateStatutoryBreakdown(salQa);

  assert(calcQa.gross_earnings === 20500, 'Junior QA gross is ₹20,500 (under statutory ₹21,000 wage ceiling)');
  assert(calcQa.esic_employee === 153.75, `ESIC Employee 0.75% calculated as ₹153.75 (got ₹${calcQa.esic_employee})`);
  assert(calcQa.esic_employer === 666.25, `ESIC Employer 3.25% calculated as ₹666.25 (got ₹${calcQa.esic_employer})`);
  assert(calcQa.tds === 0, 'Gross under taxable rebate threshold incurs ₹0 TDS');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Indian Currency Number to Words Formatter
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 5] Indian Currency Number to Words Formatter\x1b[0m');

  const words1 = numberToIndianWords(143792);
  assert(words1.includes('One Lakh Forty-Three Thousand Seven Hundred Ninety-Two'), `Format 143792 correctly: "${words1}"`);

  const words2 = numberToIndianWords(94640);
  assert(words2.includes('Ninety-Four Thousand Six Hundred Forty'), `Format 94640 correctly: "${words2}"`);

  const words3 = numberToIndianWords(18458);
  assert(words3.includes('Eighteen Thousand Four Hundred Fifty-Eight'), `Format 18458 correctly: "${words3}"`);

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Statutory Leave Balance & Approval Desk
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 6] Statutory Leave Balance & Approval Desk\x1b[0m');

  const initialRequests = getLeaveRequests();
  assert(initialRequests.length >= 2, `Existing leave requests returned (found ${initialRequests.length})`);

  // Apply new leave
  const applyRes = applyLeave({
    employee_id: 'emp-1001',
    leave_type_code: 'AL',
    start_date: '2026-11-10',
    end_date: '2026-11-12',
    total_days: 3,
    reason: 'Attending annual tech conference in Hyderabad'
  });
  assert(applyRes.success === true, 'Leave application submitted successfully');
  assert(applyRes.request.request_code.startsWith('LR-2026-'), 'Generated formatted request code');
  assert(applyRes.balance.pending >= 3, 'Leave balance pending count incremented');

  // Approve leave
  const approveRes = updateLeaveStatus(applyRes.request.id, 'APPROVE');
  assert(approveRes.success === true, 'Leave request approval processed');
  assert(approveRes.request.status === 'APPROVED', 'Request status transitioned to APPROVED');
  assert(approveRes.balance.used >= 7, 'Employee used leave days increased');

  // --------------------------------------------------------------------------
  // TEST GROUP 7: 1-Click Monthly Statutory Payroll Run & NEFT CSV Batch
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 7] 1-Click Monthly Statutory Payroll Run & NEFT CSV Batch\x1b[0m');

  const payrollRun = runMonthlyPayroll('October 2026');
  assert(payrollRun.batch.batch_code === 'PAY-2026-10', `Payroll batch code generated: ${payrollRun.batch.batch_code}`);
  assert(payrollRun.summary.headcount === 9, 'All 9 employees included in payroll batch');
  assert(payrollRun.summary.total_gross === 890500, `Total gross liability matched ₹8,90,500 (got ${payrollRun.summary.total_gross})`);
  assert(payrollRun.summary.total_net === 802984.25, `Total net disbursement calculated (₹${payrollRun.summary.total_net})`);

  // NEFT CSV Export
  const neftCsv = generateNeftDisbursementCsv('October 2026');
  assert(neftCsv.includes('Beneficiary Name,Account Number,IFSC Code,Amount,Payment Reference,Remarks'), 'NEFT CSV contains statutory bank dispatch headers');
  assert(neftCsv.includes('Adithyan Raj') && neftCsv.includes('HDFC0001242'), 'NEFT CSV contains Adithyan Raj IFSC');
  assert(neftCsv.includes('Kavya Krishnan') && neftCsv.includes('SBIN0008432'), 'NEFT CSV contains Kavya Krishnan SBI IFSC');

  // Form-16 Itemized Payslip
  const slip = getForm16Payslip('emp-1001', 'October 2026');
  assert(slip !== null, 'Form-16 payslip retrieved for EMP-1001');
  assert(slip.employee_name === 'Adithyan Raj', 'Payslip employee name matches');
  assert(slip.pan === 'AAAPR1234K', 'Payslip contains PAN number');
  assert(slip.uan === '101029384756', 'Payslip contains UAN number');
  assert(typeof slip.net_pay_words === 'string' && slip.net_pay_words.startsWith('Rupees'), 'Payslip contains net pay in words');

  // --------------------------------------------------------------------------
  // TEST GROUP 8: Cloudflare Pages Function Route Endpoints
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 8] Cloudflare Pages Function Route Endpoints\x1b[0m');

  const empRoute = await import('../functions/api/employees.js');
  const attRoute = await import('../functions/api/attendance.js');
  const leaveRoute = await import('../functions/api/leave.js');
  const payRoute = await import('../functions/api/payroll.js');
  const slipRoute = await import('../functions/api/payslips.js');
  const indexRoute = await import('../functions/api/[[route]].js');

  // GET /api/employees
  const reqEmps = new Request('https://tpl-lerp-hrms-payroll.pages.dev/api/employees');
  const resEmps = await empRoute.onRequestGet({ request: reqEmps });
  assert(resEmps.status === 200, 'GET /api/employees returns 200');
  const bodyEmps = await resEmps.json();
  assert(bodyEmps.employees.length === 9, 'GET /api/employees returns 9 active records');

  // GET /api/employees?id=emp-1001
  const reqSingle = new Request('https://tpl-lerp-hrms-payroll.pages.dev/api/employees?id=emp-1001');
  const resSingle = await empRoute.onRequestGet({ request: reqSingle });
  assert(resSingle.status === 200, 'GET /api/employees?id=emp-1001 returns 200');
  const bodySingle = await resSingle.json();
  assert(bodySingle.employee.emp_code === 'EMP-1001', 'Single employee profile matched');

  // GET /api/attendance
  const reqAtt = new Request('https://tpl-lerp-hrms-payroll.pages.dev/api/attendance?month=2026-10');
  const resAtt = await attRoute.onRequestGet({ request: reqAtt });
  assert(resAtt.status === 200, 'GET /api/attendance returns 200');
  const bodyAtt = await resAtt.json();
  assert(bodyAtt.logs.length >= 240, 'GET /api/attendance returns 30-day logs matrix');

  // POST /api/attendance
  const reqPunch = new Request('https://tpl-lerp-hrms-payroll.pages.dev/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: 'emp-1002', type: 'CLOCK_IN', latitude: 9.9312, longitude: 76.2673 })
  });
  const resPunch = await attRoute.onRequestPost({ request: reqPunch });
  assert(resPunch.status === 200, 'POST /api/attendance punch returns 200');

  // GET /api/leave
  const reqLeave = new Request('https://tpl-lerp-hrms-payroll.pages.dev/api/leave');
  const resLeave = await leaveRoute.onRequestGet({ request: reqLeave });
  assert(resLeave.status === 200, 'GET /api/leave returns 200');

  // GET /api/payroll
  const reqPay = new Request('https://tpl-lerp-hrms-payroll.pages.dev/api/payroll');
  const resPay = await payRoute.onRequestGet({ request: reqPay });
  assert(resPay.status === 200, 'GET /api/payroll returns 200');

  // GET /api/payroll?download=neft
  const reqNeft = new Request('https://tpl-lerp-hrms-payroll.pages.dev/api/payroll?download=neft&month=October%202026');
  const resNeft = await payRoute.onRequestGet({ request: reqNeft });
  assert(resNeft.status === 200, 'GET /api/payroll?download=neft returns 200');
  assert(resNeft.headers.get('Content-Type').includes('text/csv'), 'NEFT export Content-Type is text/csv');

  // GET /api/payslips
  const reqSlip = new Request('https://tpl-lerp-hrms-payroll.pages.dev/api/payslips?employee_id=emp-1001&month=October%202026');
  const resSlip = await slipRoute.onRequestGet({ request: reqSlip });
  assert(resSlip.status === 200, 'GET /api/payslips returns 200');

  // GET /api (overview)
  const reqIndex = new Request('https://tpl-lerp-hrms-payroll.pages.dev/api');
  const resIndex = await indexRoute.onRequest({ request: reqIndex });
  assert(resIndex.status === 200, 'GET /api overview route returns 200');
  const bodyIndex = await resIndex.json();
  assert(bodyIndex.service === 'tpl-lerp-hrms-payroll', 'Service name matches in index response');

  // --------------------------------------------------------------------------
  // TEST GROUP 9: HTML Layout Archetypes & Anti-Clone Compliance
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 9] HTML Layout Archetypes & Anti-Clone Compliance\x1b[0m');
  const indexPath = path.join(rootDir, 'public', 'index.html');
  const adminPath = path.join(rootDir, 'public', 'admin.html');

  assert(fs.existsSync(indexPath), 'public/index.html exists');
  assert(fs.existsSync(adminPath), 'public/admin.html exists');

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const adminHtml = fs.readFileSync(adminPath, 'utf8');

  assert(
    indexHtml.includes('data-layout-archetype="employee-self-service"'),
    'public/index.html has data-layout-archetype="employee-self-service"'
  );
  assert(
    adminHtml.includes('data-layout-archetype="people-ops-admin"'),
    'public/admin.html has data-layout-archetype="people-ops-admin"'
  );

  assert(indexHtml.includes('data-wl-brand'), 'public/index.html includes [data-wl-brand]');
  assert(adminHtml.includes('data-wl-brand'), 'public/admin.html includes [data-wl-brand]');
  assert(indexHtml.includes('id="floatingWaBtn"'), 'public/index.html includes #floatingWaBtn');
  assert(adminHtml.includes('id="adminWaInput"'), 'public/admin.html includes #adminWaInput');

  // Anti-clone & zero-placeholder verification
  const bannedPlaceholders = [
    'lorem ipsum', 'dolor sit amet', 'placeholder text', 'temp item', 'todo: implement'
  ];
  bannedPlaceholders.forEach((ph) => {
    assert(!indexHtml.toLowerCase().includes(ph), `public/index.html contains zero "${ph}" placeholders`);
    assert(!adminHtml.toLowerCase().includes(ph), `public/admin.html contains zero "${ph}" placeholders`);
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 10: Movement R Theme Tokens & Whitelabel Contract
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36m[Group 10] Movement R Theme Tokens & Whitelabel Contract\x1b[0m');
  const tokensPath = path.join(rootDir, 'public', 'theme-tokens.css');
  const wlPath = path.join(rootDir, 'public', 'whitelabel.js');

  assert(fs.existsSync(tokensPath), 'theme-tokens.css exists');
  assert(fs.existsSync(wlPath), 'whitelabel.js exists');

  const tokensCss = fs.readFileSync(tokensPath, 'utf8');
  assert(tokensCss.includes('#4f46e5'), 'CSS token contains #4f46e5 (indigo primary)');
  assert(tokensCss.includes('#6366f1'), 'CSS token contains #6366f1 (violet primary light)');
  assert(tokensCss.includes('#0f172a'), 'CSS token contains #0f172a (navy slate)');
  assert(tokensCss.includes('#1e293b'), 'CSS token contains #1e293b (card slate)');
  assert(tokensCss.includes('#10b981'), 'CSS token contains #10b981 (emerald present)');
  assert(tokensCss.includes('#f59e0b'), 'CSS token contains #f59e0b (amber late)');
  assert(tokensCss.includes('#f43f5e'), 'CSS token contains #f43f5e (rose absent)');
  assert(tokensCss.includes('#f8fafc'), 'CSS token contains #f8fafc (light canvas)');

  const wlJs = fs.readFileSync(wlPath, 'utf8');
  assert(wlJs.includes('sessionStorage'), 'whitelabel.js has sessionStorage persistence');
  assert(wlJs.includes('reset_wl=1'), 'whitelabel.js supports reset_wl=1');
  assert(!wlJs.toLowerCase().includes('kaka by eliza'), 'whitelabel.js has zero legacy Kaka by Eliza references');
  assert(!wlJs.toLowerCase().includes('boutique'), 'whitelabel.js has zero legacy Boutique references');

  console.log('\n======================================================================');
  console.log(`Test Execution Complete: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('\n❌ Uncaught error during test execution:', err);
  process.exit(1);
});
