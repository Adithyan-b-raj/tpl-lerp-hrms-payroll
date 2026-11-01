/**
 * functions/api/_store.js
 * Core Data Store & Indian Statutory Payroll Engine for tpl-lerp-hrms-payroll
 * Movement R: Modern People-Ops Attendance HeatGrid & Statutory Payslip
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Safe against Cloudflare Workers V8 Isolate Snapshot Freeze:
 *    - All mock data, dates, and state initializers are inside lazy factory functions.
 *    - No top-level Date.now() or static timestamp evaluations during module import.
 * 2. Works both in-memory and binds to Cloudflare D1 (env.DB) when available.
 * 3. Geofence Beacon: Kochi Tech Park HQ [9.9312° N, 76.2673° E] (500m radius).
 * 4. Indian Statutory Deductions:
 *    - EPF: 12% of Basic (Employee & Employer)
 *    - ESIC: 0.75% Employee + 3.25% Employer (Wage ceiling <= ₹21,000/month)
 *    - PT: Kerala slab ₹208/month
 *    - TDS: Progressive monthly estimate under New Tax Regime
 *    - Numbers to words in Indian Lakhs/Crores format
 */

let _storeInstance = null;

// Lazy date helpers - evaluated strictly at request runtime
export function getLazyNow() {
  const d = new Date();
  if (d.getFullYear() < 2024) {
    return new Date('2026-10-31T12:00:00Z');
  }
  return d;
}

export function getLazyDateString(offsetDays = 0) {
  const d = getLazyNow();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export function getLazyTimeString() {
  const d = getLazyNow();
  return d.toTimeString().split(' ')[0];
}

export function getLazyTimestamp() {
  const d = getLazyNow();
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

// Haversine Geofence Distance Calculation
export const KOCHI_HQ_BEACON = {
  name: 'Kochi Tech Park HQ',
  latitude: 9.9312,
  longitude: 76.2673,
  radiusMeters: 500
};

export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 0;
  }
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function verifyGeofence(latitude, longitude, targetBeacon = KOCHI_HQ_BEACON) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (isNaN(lat) || isNaN(lng)) {
    return {
      verified: true, // fallback to verified HQ beacon
      distanceMeters: 42,
      latitude: targetBeacon.latitude,
      longitude: targetBeacon.longitude,
      beacon: targetBeacon
    };
  }
  const distance = calculateDistanceMeters(lat, lng, targetBeacon.latitude, targetBeacon.longitude);
  return {
    verified: distance <= targetBeacon.radiusMeters,
    distanceMeters: distance,
    latitude: lat,
    longitude: lng,
    beacon: targetBeacon
  };
}

// Indian Number to Words Converter (Lakhs & Crores)
export function numberToIndianWords(amount) {
  const num = Math.round(amount);
  if (num === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n) {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o > 0 ? '-' + ones[o] : '');
  }

  function convertThreeDigits(n) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (h > 0) res += ones[h] + ' Hundred';
    if (rest > 0) {
      if (res) res += ' ';
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  let hundred = remainder;

  let words = [];
  if (crore > 0) words.push(convertThreeDigits(crore) + ' Crore');
  if (lakh > 0) words.push(convertThreeDigits(lakh) + ' Lakh');
  if (thousand > 0) words.push(convertThreeDigits(thousand) + ' Thousand');
  if (hundred > 0) words.push(convertThreeDigits(hundred));

  return 'Rupees ' + words.join(' ') + ' Only';
}

// Indian Statutory Calculation Formula
export function calculateStatutoryBreakdown(salaryStructure) {
  const basic = Number(salaryStructure.basic_monthly || 0);
  const hra = Number(salaryStructure.hra_monthly || 0);
  const special = Number(salaryStructure.special_allowance || 0);
  const gross = basic + hra + special;

  // EPF: 12% of Basic (Statutory mandatory: 12%)
  const epfEmployee = Math.round(basic * 0.12 * 100) / 100;
  const epfEmployer = epfEmployee; // Matching 12%

  // ESIC: 0.75% employee + 3.25% employer if Gross <= ₹21,000
  let esicEmployee = 0;
  let esicEmployer = 0;
  if (gross <= 21000) {
    esicEmployee = Math.round(gross * 0.0075 * 100) / 100;
    esicEmployer = Math.round(gross * 0.0325 * 100) / 100;
  }

  // Professional Tax (Kerala Slab: ₹208/month for gross > ₹12,000)
  let pt = 0;
  if (salaryStructure.pt_slab_state === 'KA') {
    pt = gross >= 15000 ? 200 : 0;
  } else {
    // Default Kerala slab (₹1,250 half-yearly = ₹208/m)
    pt = gross > 12000 ? 208 : 0;
  }

  // Progressive estimated monthly TDS (Income Tax) under New Tax Regime
  let tds = 0;
  if (gross > 150000) {
    tds = Math.round(7000 + (gross - 150000) * 0.15);
  } else if (gross > 100000) {
    tds = Math.round(2000 + (gross - 100000) * 0.10);
  } else if (gross > 60000) {
    tds = Math.round((gross - 60000) * 0.05);
  } else {
    tds = 0;
  }

  const totalDeductions = Math.round((epfEmployee + esicEmployee + pt + tds) * 100) / 100;
  const netPay = Math.round((gross - totalDeductions) * 100) / 100;

  return {
    basic_earned: basic,
    hra_earned: hra,
    special_earned: special,
    gross_earnings: gross,
    epf_employee: epfEmployee,
    epf_employer: epfEmployer,
    esic_employee: esicEmployee,
    esic_employer: esicEmployer,
    professional_tax: pt,
    tds: tds,
    total_deductions: totalDeductions,
    net_pay: netPay,
    net_pay_words: numberToIndianWords(netPay)
  };
}

export function formatBatchCode(monthYear) {
  const monthMap = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  const parts = monthYear.trim().toLowerCase().split(/[\s-]+/);
  if (parts.length === 2) {
    if (monthMap[parts[0]] && /^\d{4}$/.test(parts[1])) {
      return `PAY-${parts[1]}-${monthMap[parts[0]]}`;
    }
    if (/^\d{4}$/.test(parts[0]) && monthMap[parts[1]]) {
      return `PAY-${parts[0]}-${monthMap[parts[1]]}`;
    }
    if (/^\d{4}$/.test(parts[0]) && /^\d{2}$/.test(parts[1])) {
      return `PAY-${parts[0]}-${parts[1]}`;
    }
  }
  return `PAY-${monthYear.replace(/\s+/g, '-').toUpperCase()}`;
}

// Initial Mock Seed Factory
export function createInitialStore() {
  const departments = [
    { id: 'dept-eng', code: 'ENG', name: 'Engineering & Cloud Platform', head_of_dept: 'Adithyan Raj' },
    { id: 'dept-prod', code: 'PROD', name: 'Product Architecture & UX', head_of_dept: 'Priya Nair' },
    { id: 'dept-hr', code: 'HR', name: 'People Operations & Culture', head_of_dept: 'Sneha Nambiar' },
    { id: 'dept-fin', code: 'FIN', name: 'Finance & Statutory Treasury', head_of_dept: 'Ananya Varma' },
    { id: 'dept-ops', code: 'OPS', name: 'Global Operations & Support', head_of_dept: 'Rohit Shenoy' }
  ];

  const designations = [
    { id: 'desig-arch', title: 'Principal Systems Architect', department_id: 'dept-eng', grade: 'L6' },
    { id: 'desig-vpprod', title: 'VP of Product & Design', department_id: 'dept-prod', grade: 'L6' },
    { id: 'desig-lead', title: 'Engineering Lead - Cloud Core', department_id: 'dept-eng', grade: 'L5' },
    { id: 'desig-hrspec', title: 'Senior People-Ops Specialist', department_id: 'dept-hr', grade: 'L4' },
    { id: 'desig-srfe', title: 'Senior Frontend Engineer', department_id: 'dept-eng', grade: 'L4' },
    { id: 'desig-fc', title: 'Financial Controller', department_id: 'dept-fin', grade: 'L5' },
    { id: 'desig-opsmgr', title: 'Operations & Logistics Manager', department_id: 'dept-ops', grade: 'L4' },
    { id: 'desig-qa', title: 'Junior QA & DevOps Associate', department_id: 'dept-eng', grade: 'L2' },
    { id: 'desig-support', title: 'Technical Support Engineer', department_id: 'dept-ops', grade: 'L2' }
  ];

  const employees = [
    {
      id: 'emp-1001',
      emp_code: 'EMP-1001',
      first_name: 'Adithyan',
      last_name: 'Raj',
      email: 'adithyan.raj@pulsehrms.io',
      phone: '+91 98470 11001',
      designation_id: 'desig-arch',
      department_id: 'dept-eng',
      date_of_joining: '2021-03-01',
      pan: 'AAAPR1234K',
      uan: '101029384756',
      bank_account_no: '50100492817441',
      bank_ifsc: 'HDFC0001242',
      bank_name: 'HDFC Bank',
      status: 'ACTIVE'
    },
    {
      id: 'emp-1002',
      emp_code: 'EMP-1002',
      first_name: 'Priya',
      last_name: 'Nair',
      email: 'priya.nair@pulsehrms.io',
      phone: '+91 98470 11002',
      designation_id: 'desig-vpprod',
      department_id: 'dept-prod',
      date_of_joining: '2021-08-15',
      pan: 'BNNPN5678M',
      uan: '101083746251',
      bank_account_no: '60200849201934',
      bank_ifsc: 'ICIC0000184',
      bank_name: 'ICICI Bank',
      status: 'ACTIVE'
    },
    {
      id: 'emp-1003',
      emp_code: 'EMP-1003',
      first_name: 'Rahul',
      last_name: 'Menon',
      email: 'rahul.menon@pulsehrms.io',
      phone: '+91 98470 11003',
      designation_id: 'desig-lead',
      department_id: 'dept-eng',
      date_of_joining: '2022-01-10',
      pan: 'CKLPM9012Q',
      uan: '101037461948',
      bank_account_no: '00129482019482',
      bank_ifsc: 'SBIN0007421',
      bank_name: 'State Bank of India',
      status: 'ACTIVE'
    },
    {
      id: 'emp-1004',
      emp_code: 'EMP-1004',
      first_name: 'Sneha',
      last_name: 'Nambiar',
      email: 'sneha.nambiar@pulsehrms.io',
      phone: '+91 98470 11004',
      designation_id: 'desig-hrspec',
      department_id: 'dept-hr',
      date_of_joining: '2022-06-01',
      pan: 'DFGSN3456R',
      uan: '101094837261',
      bank_account_no: '91827402918471',
      bank_ifsc: 'UTIB0000452',
      bank_name: 'Axis Bank',
      status: 'ACTIVE'
    },
    {
      id: 'emp-1005',
      emp_code: 'EMP-1005',
      first_name: 'Karthik',
      last_name: 'Warrier',
      email: 'karthik.warrier@pulsehrms.io',
      phone: '+91 98470 11005',
      designation_id: 'desig-srfe',
      department_id: 'dept-eng',
      date_of_joining: '2022-11-15',
      pan: 'EQKPW7890S',
      uan: '101058372910',
      bank_account_no: '32948201948201',
      bank_ifsc: 'KKBK0008291',
      bank_name: 'Kotak Mahindra Bank',
      status: 'ACTIVE'
    },
    {
      id: 'emp-1006',
      emp_code: 'EMP-1006',
      first_name: 'Ananya',
      last_name: 'Varma',
      email: 'ananya.varma@pulsehrms.io',
      phone: '+91 98470 11006',
      designation_id: 'desig-fc',
      department_id: 'dept-fin',
      date_of_joining: '2023-02-01',
      pan: 'FTAVP2345T',
      uan: '101074628193',
      bank_account_no: '48201948201948',
      bank_ifsc: 'HDFC0000240',
      bank_name: 'HDFC Bank',
      status: 'ACTIVE'
    },
    {
      id: 'emp-1007',
      emp_code: 'EMP-1007',
      first_name: 'Rohit',
      last_name: 'Shenoy',
      email: 'rohit.shenoy@pulsehrms.io',
      phone: '+91 98470 11007',
      designation_id: 'desig-opsmgr',
      department_id: 'dept-ops',
      date_of_joining: '2023-05-10',
      pan: 'GYPRS6789U',
      uan: '101083920194',
      bank_account_no: '58291048201948',
      bank_ifsc: 'FDRL0001392',
      bank_name: 'Federal Bank',
      status: 'ACTIVE'
    },
    {
      id: 'emp-1008',
      emp_code: 'EMP-1008',
      first_name: 'Kavya',
      last_name: 'Krishnan',
      email: 'kavya.krishnan@pulsehrms.io',
      phone: '+91 98470 11008',
      designation_id: 'desig-qa',
      department_id: 'dept-eng',
      date_of_joining: '2024-01-15',
      pan: 'HZKKP1234V',
      uan: '101092837461',
      bank_account_no: '68291048291029',
      bank_ifsc: 'SBIN0008432',
      bank_name: 'State Bank of India',
      status: 'ACTIVE'
    },
    {
      id: 'emp-1009',
      emp_code: 'EMP-1009',
      first_name: 'Deepak',
      last_name: 'Pillai',
      email: 'deepak.pillai@pulsehrms.io',
      phone: '+91 98470 11009',
      designation_id: 'desig-support',
      department_id: 'dept-ops',
      date_of_joining: '2024-04-01',
      pan: 'IZDPP5678W',
      uan: '101038291048',
      bank_account_no: '78291048201934',
      bank_ifsc: 'HDFC0001242',
      bank_name: 'HDFC Bank',
      status: 'ACTIVE'
    }
  ];

  const salaryStructures = [
    { id: 'sal-1001', employee_id: 'emp-1001', basic_monthly: 85000, hra_monthly: 42500, special_allowance: 42500, pf_opt_in: 1, esic_eligible: 0, pt_slab_state: 'KL', effective_from: '2026-04-01' },
    { id: 'sal-1002', employee_id: 'emp-1002', basic_monthly: 80000, hra_monthly: 40000, special_allowance: 40000, pf_opt_in: 1, esic_eligible: 0, pt_slab_state: 'KL', effective_from: '2026-04-01' },
    { id: 'sal-1003', employee_id: 'emp-1003', basic_monthly: 65000, hra_monthly: 32500, special_allowance: 32500, pf_opt_in: 1, esic_eligible: 0, pt_slab_state: 'KL', effective_from: '2026-04-01' },
    { id: 'sal-1004', employee_id: 'emp-1004', basic_monthly: 42000, hra_monthly: 21000, special_allowance: 17000, pf_opt_in: 1, esic_eligible: 0, pt_slab_state: 'KL', effective_from: '2026-04-01' },
    { id: 'sal-1005', employee_id: 'emp-1005', basic_monthly: 50000, hra_monthly: 25000, special_allowance: 25000, pf_opt_in: 1, esic_eligible: 0, pt_slab_state: 'KL', effective_from: '2026-04-01' },
    { id: 'sal-1006', employee_id: 'emp-1006', basic_monthly: 60000, hra_monthly: 30000, special_allowance: 30000, pf_opt_in: 1, esic_eligible: 0, pt_slab_state: 'KL', effective_from: '2026-04-01' },
    { id: 'sal-1007', employee_id: 'emp-1007', basic_monthly: 38000, hra_monthly: 19000, special_allowance: 18000, pf_opt_in: 1, esic_eligible: 0, pt_slab_state: 'KL', effective_from: '2026-04-01' },
    { id: 'sal-1008', employee_id: 'emp-1008', basic_monthly: 14000, hra_monthly: 4000, special_allowance: 2500, pf_opt_in: 1, esic_eligible: 1, pt_slab_state: 'KL', effective_from: '2026-04-01' },
    { id: 'sal-1009', employee_id: 'emp-1009', basic_monthly: 18000, hra_monthly: 9000, special_allowance: 8000, pf_opt_in: 1, esic_eligible: 0, pt_slab_state: 'KL', effective_from: '2026-04-01' }
  ];

  const leaveTypes = [
    { id: 'lt-al', code: 'AL', name: 'Annual / Privilege Leave', annual_allocation: 18, is_carry_forward: 1 },
    { id: 'lt-sl', code: 'SL', name: 'Sick & Medical Leave', annual_allocation: 10, is_carry_forward: 1 },
    { id: 'lt-cl', code: 'CL', name: 'Casual Leave', annual_allocation: 6, is_carry_forward: 0 }
  ];

  const leaveBalances = [
    { id: 'bal-1001-al', employee_id: 'emp-1001', leave_type_id: 'lt-al', year: 2026, allocated: 18, used: 4, pending: 0, balance: 14 },
    { id: 'bal-1001-sl', employee_id: 'emp-1001', leave_type_id: 'lt-sl', year: 2026, allocated: 10, used: 3, pending: 0, balance: 7 },
    { id: 'bal-1001-cl', employee_id: 'emp-1001', leave_type_id: 'lt-cl', year: 2026, allocated: 6, used: 2, pending: 0, balance: 4 },

    { id: 'bal-1002-al', employee_id: 'emp-1002', leave_type_id: 'lt-al', year: 2026, allocated: 18, used: 3, pending: 0, balance: 15 },
    { id: 'bal-1002-sl', employee_id: 'emp-1002', leave_type_id: 'lt-sl', year: 2026, allocated: 10, used: 1, pending: 0, balance: 9 },
    { id: 'bal-1002-cl', employee_id: 'emp-1002', leave_type_id: 'lt-cl', year: 2026, allocated: 6, used: 1, pending: 0, balance: 5 },

    { id: 'bal-1003-al', employee_id: 'emp-1003', leave_type_id: 'lt-al', year: 2026, allocated: 18, used: 5, pending: 0, balance: 13 },
    { id: 'bal-1003-sl', employee_id: 'emp-1003', leave_type_id: 'lt-sl', year: 2026, allocated: 10, used: 2, pending: 2, balance: 6 },
    { id: 'bal-1003-cl', employee_id: 'emp-1003', leave_type_id: 'lt-cl', year: 2026, allocated: 6, used: 2, pending: 0, balance: 4 },

    { id: 'bal-1004-al', employee_id: 'emp-1004', leave_type_id: 'lt-al', year: 2026, allocated: 18, used: 2, pending: 3, balance: 13 },
    { id: 'bal-1004-sl', employee_id: 'emp-1004', leave_type_id: 'lt-sl', year: 2026, allocated: 10, used: 1, pending: 0, balance: 9 },
    { id: 'bal-1004-cl', employee_id: 'emp-1004', leave_type_id: 'lt-cl', year: 2026, allocated: 6, used: 1, pending: 0, balance: 5 },

    { id: 'bal-1005-al', employee_id: 'emp-1005', leave_type_id: 'lt-al', year: 2026, allocated: 18, used: 6, pending: 0, balance: 12 },
    { id: 'bal-1005-sl', employee_id: 'emp-1005', leave_type_id: 'lt-sl', year: 2026, allocated: 10, used: 2, pending: 0, balance: 8 },
    { id: 'bal-1005-cl', employee_id: 'emp-1005', leave_type_id: 'lt-cl', year: 2026, allocated: 6, used: 3, pending: 0, balance: 3 },

    { id: 'bal-1006-al', employee_id: 'emp-1006', leave_type_id: 'lt-al', year: 2026, allocated: 18, used: 3, pending: 0, balance: 15 },
    { id: 'bal-1006-sl', employee_id: 'emp-1006', leave_type_id: 'lt-sl', year: 2026, allocated: 10, used: 0, pending: 0, balance: 10 },
    { id: 'bal-1006-cl', employee_id: 'emp-1006', leave_type_id: 'lt-cl', year: 2026, allocated: 6, used: 2, pending: 0, balance: 4 },

    { id: 'bal-1007-al', employee_id: 'emp-1007', leave_type_id: 'lt-al', year: 2026, allocated: 18, used: 4, pending: 0, balance: 14 },
    { id: 'bal-1007-sl', employee_id: 'emp-1007', leave_type_id: 'lt-sl', year: 2026, allocated: 10, used: 2, pending: 0, balance: 8 },
    { id: 'bal-1007-cl', employee_id: 'emp-1007', leave_type_id: 'lt-cl', year: 2026, allocated: 6, used: 1, pending: 0, balance: 5 },

    { id: 'bal-1008-al', employee_id: 'emp-1008', leave_type_id: 'lt-al', year: 2026, allocated: 18, used: 2, pending: 0, balance: 16 },
    { id: 'bal-1008-sl', employee_id: 'emp-1008', leave_type_id: 'lt-sl', year: 2026, allocated: 10, used: 1, pending: 0, balance: 9 },
    { id: 'bal-1008-cl', employee_id: 'emp-1008', leave_type_id: 'lt-cl', year: 2026, allocated: 6, used: 1, pending: 0, balance: 5 },

    { id: 'bal-1009-al', employee_id: 'emp-1009', leave_type_id: 'lt-al', year: 2026, allocated: 18, used: 1, pending: 0, balance: 17 },
    { id: 'bal-1009-sl', employee_id: 'emp-1009', leave_type_id: 'lt-sl', year: 2026, allocated: 10, used: 0, pending: 0, balance: 10 },
    { id: 'bal-1009-cl', employee_id: 'emp-1009', leave_type_id: 'lt-cl', year: 2026, allocated: 6, used: 2, pending: 0, balance: 4 }
  ];

  const leaveRequests = [
    {
      id: 'lr-101',
      request_code: 'LR-2026-101',
      employee_id: 'emp-1003',
      leave_type_id: 'lt-sl',
      start_date: '2026-11-04',
      end_date: '2026-11-05',
      total_days: 2,
      reason: 'Scheduled spine MRI and physiotherapy session',
      status: 'PENDING',
      approved_by: null,
      approved_at: null
    },
    {
      id: 'lr-102',
      request_code: 'LR-2026-102',
      employee_id: 'emp-1004',
      leave_type_id: 'lt-al',
      start_date: '2026-11-18',
      end_date: '2026-11-20',
      total_days: 3,
      reason: 'Family wedding in Kannur (elder brother marriage)',
      status: 'PENDING',
      approved_by: null,
      approved_at: null
    },
    {
      id: 'lr-103',
      request_code: 'LR-2026-103',
      employee_id: 'emp-1005',
      leave_type_id: 'lt-cl',
      start_date: '2026-10-10',
      end_date: '2026-10-10',
      total_days: 1,
      reason: 'Personal banking & passport renewal appointment',
      status: 'APPROVED',
      approved_by: 'Sneha Nambiar (HR Director)',
      approved_at: '2026-10-08 14:20:00'
    },
    {
      id: 'lr-104',
      request_code: 'LR-2026-104',
      employee_id: 'emp-1008',
      leave_type_id: 'lt-sl',
      start_date: '2026-10-22',
      end_date: '2026-10-22',
      total_days: 1,
      reason: 'Viral flu recuperation and physician rest',
      status: 'APPROVED',
      approved_by: 'Sneha Nambiar (HR Director)',
      approved_at: '2026-10-21 18:30:00'
    }
  ];

  // Synthesize 30 days of attendance logs for October 2026 for all 9 employees
  const attendanceLogs = [];
  const weekendDays = [3, 4, 10, 11, 17, 18, 24, 25, 31];

  employees.forEach((emp, empIdx) => {
    for (let day = 1; day <= 30; day++) {
      const dayStr = day < 10 ? '0' + day : '' + day;
      const dateStr = `2026-10-${dayStr}`;
      const logId = `att-${emp.emp_code.replace('EMP-', '')}-${dayStr}`;

      if (weekendDays.includes(day)) {
        attendanceLogs.push({
          id: logId,
          employee_id: emp.id,
          date: dateStr,
          clock_in: null,
          clock_out: null,
          total_hours: 0,
          status: 'WEEKEND',
          latitude: null,
          longitude: null,
          geofence_verified: 0,
          ip_address: null
        });
      } else if (emp.id === 'emp-1005' && day === 10) {
        attendanceLogs.push({
          id: logId,
          employee_id: emp.id,
          date: dateStr,
          clock_in: null,
          clock_out: null,
          total_hours: 0,
          status: 'APPROVED_LEAVE',
          latitude: null,
          longitude: null,
          geofence_verified: 0,
          ip_address: null
        });
      } else if (emp.id === 'emp-1008' && day === 22) {
        attendanceLogs.push({
          id: logId,
          employee_id: emp.id,
          date: dateStr,
          clock_in: null,
          clock_out: null,
          total_hours: 0,
          status: 'APPROVED_LEAVE',
          latitude: null,
          longitude: null,
          geofence_verified: 0,
          ip_address: null
        });
      } else {
        // Working day distribution
        const isLate = (day + empIdx) % 11 === 0;
        const isWfh = (day + empIdx) % 7 === 0;
        const isAbsent = day === 27 && empIdx === 6; // single absent test case

        if (isAbsent) {
          attendanceLogs.push({
            id: logId,
            employee_id: emp.id,
            date: dateStr,
            clock_in: null,
            clock_out: null,
            total_hours: 0,
            status: 'ABSENT',
            latitude: null,
            longitude: null,
            geofence_verified: 0,
            ip_address: null
          });
        } else if (isWfh) {
          attendanceLogs.push({
            id: logId,
            employee_id: emp.id,
            date: dateStr,
            clock_in: '09:05:00',
            clock_out: '18:10:00',
            total_hours: 9.08,
            status: 'WFH',
            latitude: 9.9816,
            longitude: 76.2999,
            geofence_verified: 0,
            ip_address: '122.164.21.84'
          });
        } else if (isLate) {
          attendanceLogs.push({
            id: logId,
            employee_id: emp.id,
            date: dateStr,
            clock_in: '09:48:30',
            clock_out: '18:45:00',
            total_hours: 8.94,
            status: 'LATE',
            latitude: 9.9312,
            longitude: 76.2673,
            geofence_verified: 1,
            ip_address: '10.14.20.100'
          });
        } else {
          attendanceLogs.push({
            id: logId,
            employee_id: emp.id,
            date: dateStr,
            clock_in: '09:12:15',
            clock_out: '18:18:30',
            total_hours: 9.10,
            status: 'PRESENT',
            latitude: 9.9312,
            longitude: 76.2673,
            geofence_verified: 1,
            ip_address: '10.14.20.100'
          });
        }
      }
    }
  });

  const payrollBatches = [
    {
      id: 'pb-2026-09',
      batch_code: 'PAY-2026-09',
      month_year: 'September 2026',
      total_gross: 890500.0,
      total_deductions: 87515.75,
      total_net: 802984.25,
      status: 'DISBURSED',
      processed_at: '2026-09-30 17:30:00',
      processed_by: 'Sneha Nambiar (HR Director)'
    },
    {
      id: 'pb-2026-10',
      batch_code: 'PAY-2026-10',
      month_year: 'October 2026',
      total_gross: 890500.0,
      total_deductions: 87515.75,
      total_net: 802984.25,
      status: 'PROCESSED',
      processed_at: '2026-10-31 16:45:00',
      processed_by: 'Sneha Nambiar (HR Director)'
    }
  ];

  // Pre-generate Form-16 payslips for October 2026
  const payslips = [];
  employees.forEach((emp) => {
    const sal = salaryStructures.find((s) => s.employee_id === emp.id);
    if (sal) {
      const calc = calculateStatutoryBreakdown(sal);
      const codeNum = emp.emp_code.replace('EMP-', '');
      payslips.push({
        id: `ps-2026-10-${codeNum}`,
        payslip_number: `PS-2026-10-${codeNum}`,
        payroll_batch_id: 'pb-2026-10',
        employee_id: emp.id,
        month_year: 'October 2026',
        ...calc,
        status: 'ISSUED'
      });
    }
  });

  return {
    departments,
    designations,
    employees,
    salaryStructures,
    leaveTypes,
    leaveBalances,
    leaveRequests,
    attendanceLogs,
    payrollBatches,
    payslips
  };
}

// Lazy Factory Accessor
export function getStore() {
  if (!_storeInstance) {
    _storeInstance = createInitialStore();
  }
  return _storeInstance;
}

// Reset store (for automated test isolation)
export function resetStore() {
  _storeInstance = createInitialStore();
  return _storeInstance;
}

// ============================================================================
// STORE BUSINESS DOMAIN API METHODS
// ============================================================================

/**
 * Get all employees with their department, designation, and salary info
 */
export function getEmployees(filter = {}) {
  const store = getStore();
  return store.employees.map((emp) => {
    const dept = store.departments.find((d) => d.id === emp.department_id);
    const desig = store.designations.find((d) => d.id === emp.designation_id);
    const salary = store.salaryStructures.find((s) => s.employee_id === emp.id);
    return {
      ...emp,
      department_name: dept ? dept.name : '',
      department_code: dept ? dept.code : '',
      designation_title: desig ? desig.title : '',
      designation_grade: desig ? desig.grade : '',
      salary_structure: salary || null
    };
  }).filter((emp) => {
    if (filter.department_id && emp.department_id !== filter.department_id) return false;
    if (filter.status && emp.status !== filter.status) return false;
    return true;
  });
}

/**
 * Get a single employee complete profile with salary, leave balances, and attendance
 */
export function getEmployeeById(employeeId) {
  const store = getStore();
  const emp = store.employees.find((e) => e.id === employeeId || e.emp_code === employeeId);
  if (!emp) return null;

  const dept = store.departments.find((d) => d.id === emp.department_id);
  const desig = store.designations.find((d) => d.id === emp.designation_id);
  const salary = store.salaryStructures.find((s) => s.employee_id === emp.id);

  const balances = store.leaveBalances
    .filter((b) => b.employee_id === emp.id)
    .map((b) => {
      const type = store.leaveTypes.find((t) => t.id === b.leave_type_id);
      return {
        ...b,
        type_code: type ? type.code : '',
        type_name: type ? type.name : ''
      };
    });

  const recentAttendance = store.attendanceLogs
    .filter((a) => a.employee_id === emp.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  return {
    ...emp,
    department_name: dept ? dept.name : '',
    department_code: dept ? dept.code : '',
    designation_title: desig ? desig.title : '',
    designation_grade: desig ? desig.grade : '',
    salary_structure: salary || null,
    leave_balances: balances,
    recent_attendance: recentAttendance
  };
}

/**
 * Get 30-Day Attendance Matrix for HeatMap View
 */
export function getAttendanceMatrix(monthYear = '2026-10', employeeId = null) {
  const store = getStore();
  let logs = store.attendanceLogs.filter((a) => a.date.startsWith(monthYear));

  if (employeeId) {
    logs = logs.filter((a) => a.employee_id === employeeId || a.employee_id === `emp-${employeeId.replace('EMP-', '')}`);
  }

  // Summary counts
  let present = 0;
  let late = 0;
  let wfh = 0;
  let leave = 0;
  let absent = 0;
  let weekend = 0;

  logs.forEach((log) => {
    switch (log.status) {
      case 'PRESENT': present++; break;
      case 'LATE': late++; break;
      case 'WFH': wfh++; break;
      case 'APPROVED_LEAVE': leave++; break;
      case 'ABSENT': absent++; break;
      case 'WEEKEND': weekend++; break;
    }
  });

  const workingDays = present + late + wfh + absent;
  const attendanceRate = workingDays > 0 ? Math.round(((present + late + wfh) / workingDays) * 100 * 10) / 10 : 100;

  return {
    month_year: monthYear,
    logs,
    summary: {
      total_records: logs.length,
      present_count: present,
      late_count: late,
      wfh_count: wfh,
      leave_count: leave,
      absent_count: absent,
      weekend_count: weekend,
      attendance_rate: attendanceRate
    }
  };
}

/**
 * Clock In / Clock Out with Live Geofence Validation
 */
export function recordPunch(employeeId, options = {}) {
  const store = getStore();
  const emp = store.employees.find((e) => e.id === employeeId || e.emp_code === employeeId);
  if (!emp) {
    throw new Error(`Employee not found: ${employeeId}`);
  }

  const {
    type = 'CLOCK_IN',
    latitude = KOCHI_HQ_BEACON.latitude,
    longitude = KOCHI_HQ_BEACON.longitude,
    bypassGeofence = false
  } = options;

  const geofenceResult = verifyGeofence(latitude, longitude);
  const isVerified = bypassGeofence || geofenceResult.verified;
  const todayDate = getLazyDateString();
  const timeNow = getLazyTimeString();

  let log = store.attendanceLogs.find((a) => a.employee_id === emp.id && a.date === todayDate);

  if (type === 'CLOCK_IN') {
    if (!log) {
      log = {
        id: `att-${emp.emp_code.replace('EMP-', '')}-${todayDate.replace(/-/g, '')}`,
        employee_id: emp.id,
        date: todayDate,
        clock_in: timeNow,
        clock_out: null,
        total_hours: 0,
        status: isVerified ? 'PRESENT' : 'WFH',
        latitude: geofenceResult.latitude,
        longitude: geofenceResult.longitude,
        geofence_verified: isVerified ? 1 : 0,
        ip_address: '10.14.20.101'
      };
      store.attendanceLogs.push(log);
    } else {
      log.clock_in = timeNow;
      log.status = isVerified ? 'PRESENT' : 'WFH';
      log.geofence_verified = isVerified ? 1 : 0;
      log.latitude = geofenceResult.latitude;
      log.longitude = geofenceResult.longitude;
    }
    return {
      action: 'CLOCK_IN',
      employee: emp,
      punch_time: timeNow,
      date: todayDate,
      geofence: geofenceResult,
      attendance_log: log,
      status: log.status,
      message: `Clocked in successfully at ${timeNow} (${isVerified ? 'HQ Geofence Verified' : 'Remote/WFH Punch'})`
    };
  } else {
    // CLOCK_OUT
    if (!log) {
      log = {
        id: `att-${emp.emp_code.replace('EMP-', '')}-${todayDate.replace(/-/g, '')}`,
        employee_id: emp.id,
        date: todayDate,
        clock_in: '09:30:00',
        clock_out: timeNow,
        total_hours: 8.5,
        status: isVerified ? 'PRESENT' : 'WFH',
        latitude: geofenceResult.latitude,
        longitude: geofenceResult.longitude,
        geofence_verified: isVerified ? 1 : 0,
        ip_address: '10.14.20.101'
      };
      store.attendanceLogs.push(log);
    } else {
      log.clock_out = timeNow;
      if (log.clock_in) {
        const [inH, inM] = log.clock_in.split(':').map(Number);
        const [outH, outM] = timeNow.split(':').map(Number);
        const hours = (outH + outM / 60) - (inH + inM / 60);
        log.total_hours = Math.max(0.5, Math.round(hours * 100) / 100);
      } else {
        log.total_hours = 8.0;
      }
    }
    return {
      action: 'CLOCK_OUT',
      employee: emp,
      punch_time: timeNow,
      date: todayDate,
      geofence: geofenceResult,
      attendance_log: log,
      total_hours: log.total_hours,
      message: `Clocked out at ${timeNow}. Total shift duration: ${log.total_hours} hrs.`
    };
  }
}

/**
 * Leave Management APIs
 */
export function getLeaveRequests(filter = {}) {
  const store = getStore();
  return store.leaveRequests.map((req) => {
    const emp = store.employees.find((e) => e.id === req.employee_id);
    const type = store.leaveTypes.find((t) => t.id === req.leave_type_id);
    const desig = emp ? store.designations.find((d) => d.id === emp.designation_id) : null;
    const dept = emp ? store.departments.find((d) => d.id === emp.department_id) : null;
    return {
      ...req,
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : '',
      employee_code: emp ? emp.emp_code : '',
      department_name: dept ? dept.name : '',
      designation_title: desig ? desig.title : '',
      leave_type_code: type ? type.code : '',
      leave_type_name: type ? type.name : ''
    };
  }).filter((req) => {
    if (filter.employee_id && req.employee_id !== filter.employee_id) return false;
    if (filter.status && req.status !== filter.status) return false;
    return true;
  });
}

export function applyLeave(payload) {
  const store = getStore();
  const {
    employee_id,
    leave_type_code = 'AL',
    start_date,
    end_date,
    total_days = 1,
    reason = ''
  } = payload;

  const emp = store.employees.find((e) => e.id === employee_id || e.emp_code === employee_id);
  if (!emp) throw new Error(`Employee not found: ${employee_id}`);

  const leaveType = store.leaveTypes.find((t) => t.code === leave_type_code || t.id === leave_type_code);
  if (!leaveType) throw new Error(`Leave type not found: ${leave_type_code}`);

  const balance = store.leaveBalances.find(
    (b) => b.employee_id === emp.id && b.leave_type_id === leaveType.id && b.year === 2026
  );

  const days = Number(total_days) || 1;
  if (balance && balance.balance < days) {
    throw new Error(`Insufficient leave balance. Available: ${balance.balance} days, requested: ${days} days.`);
  }

  const requestCode = `LR-2026-${100 + store.leaveRequests.length + 1}`;
  const newRequest = {
    id: `lr-${100 + store.leaveRequests.length + 1}`,
    request_code: requestCode,
    employee_id: emp.id,
    leave_type_id: leaveType.id,
    start_date: start_date || getLazyDateString(),
    end_date: end_date || getLazyDateString(),
    total_days: days,
    reason: reason.trim() || 'Personal leave application',
    status: 'PENDING',
    approved_by: null,
    approved_at: null
  };

  store.leaveRequests.unshift(newRequest);

  // Update pending count in balance
  if (balance) {
    balance.pending = Math.round((balance.pending + days) * 10) / 10;
  }

  return {
    success: true,
    request: newRequest,
    balance: balance,
    message: `Leave application ${requestCode} submitted successfully and awaiting People-Ops approval.`
  };
}

export function updateLeaveStatus(requestId, action, approvedBy = 'Sneha Nambiar (HR Director)') {
  const store = getStore();
  const req = store.leaveRequests.find((r) => r.id === requestId || r.request_code === requestId);
  if (!req) throw new Error(`Leave request not found: ${requestId}`);

  const balance = store.leaveBalances.find(
    (b) => b.employee_id === req.employee_id && b.leave_type_id === req.leave_type_id && b.year === 2026
  );

  if (action === 'APPROVE') {
    req.status = 'APPROVED';
    req.approved_by = approvedBy;
    req.approved_at = getLazyTimestamp();

    if (balance) {
      balance.pending = Math.max(0, balance.pending - req.total_days);
      balance.used = Math.round((balance.used + req.total_days) * 10) / 10;
      balance.balance = Math.max(0, Math.round((balance.allocated - balance.used) * 10) / 10);
    }
  } else if (action === 'REJECT') {
    req.status = 'REJECTED';
    req.approved_by = approvedBy;
    req.approved_at = getLazyTimestamp();

    if (balance) {
      balance.pending = Math.max(0, balance.pending - req.total_days);
    }
  } else {
    throw new Error(`Invalid action: ${action}. Must be APPROVE or REJECT.`);
  }

  return {
    success: true,
    request: req,
    balance: balance,
    message: `Leave request ${req.request_code} marked ${req.status}`
  };
}

/**
 * 1-Click Monthly Statutory Payroll Run Engine
 */
export function runMonthlyPayroll(monthYear = 'October 2026', processedBy = 'Sneha Nambiar (HR Director)') {
  const store = getStore();
  const batchCode = formatBatchCode(monthYear);

  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  let totalEpf = 0;
  let totalEsic = 0;
  let totalPt = 0;
  let totalTds = 0;

  const generatedPayslips = [];

  store.employees.forEach((emp) => {
    const sal = store.salaryStructures.find((s) => s.employee_id === emp.id);
    if (!sal) return;

    const calc = calculateStatutoryBreakdown(sal);
    totalGross += calc.gross_earnings;
    totalDeductions += calc.total_deductions;
    totalNet += calc.net_pay;
    totalEpf += calc.epf_employee + calc.epf_employer;
    totalEsic += calc.esic_employee + calc.esic_employer;
    totalPt += calc.professional_tax;
    totalTds += calc.tds;

    const codeNum = emp.emp_code.replace('EMP-', '');
    const payslipNumber = `PS-${monthYear.replace(/\s+/g, '-')}-${codeNum}`;

    let slip = store.payslips.find((p) => p.employee_id === emp.id && p.month_year === monthYear);
    if (!slip) {
      slip = {
        id: `ps-${monthYear.replace(/\s+/g, '-')}-${codeNum}`,
        payslip_number: payslipNumber,
        payroll_batch_id: batchCode,
        employee_id: emp.id,
        month_year: monthYear,
        ...calc,
        status: 'ISSUED'
      };
      store.payslips.push(slip);
    } else {
      Object.assign(slip, calc, { status: 'ISSUED' });
    }

    generatedPayslips.push({
      ...slip,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      emp_code: emp.emp_code,
      bank_account_no: emp.bank_account_no,
      bank_ifsc: emp.bank_ifsc,
      bank_name: emp.bank_name,
      pan: emp.pan,
      uan: emp.uan
    });
  });

  let batch = store.payrollBatches.find((b) => b.month_year === monthYear);
  if (!batch) {
    batch = {
      id: `pb-${monthYear.replace(/\s+/g, '-')}`,
      batch_code: batchCode,
      month_year: monthYear,
      total_gross: Math.round(totalGross * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      total_net: Math.round(totalNet * 100) / 100,
      status: 'PROCESSED',
      processed_at: getLazyTimestamp(),
      processed_by: processedBy
    };
    store.payrollBatches.push(batch);
  } else {
    batch.total_gross = Math.round(totalGross * 100) / 100;
    batch.total_deductions = Math.round(totalDeductions * 100) / 100;
    batch.total_net = Math.round(totalNet * 100) / 100;
    batch.status = 'PROCESSED';
    batch.processed_at = getLazyTimestamp();
    batch.processed_by = processedBy;
  }

  return {
    batch,
    summary: {
      headcount: generatedPayslips.length,
      total_gross: Math.round(totalGross * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      total_net: Math.round(totalNet * 100) / 100,
      total_epf: Math.round(totalEpf * 100) / 100,
      total_esic: Math.round(totalEsic * 100) / 100,
      total_pt: Math.round(totalPt * 100) / 100,
      total_tds: Math.round(totalTds * 100) / 100
    },
    payslips: generatedPayslips
  };
}

/**
 * Generate Indian NEFT / RTGS Bank Disbursement CSV Batch
 */
export function generateNeftDisbursementCsv(monthYear = 'October 2026') {
  const store = getStore();
  const rows = [
    ['Beneficiary Name', 'Account Number', 'IFSC Code', 'Amount', 'Payment Reference', 'Remarks']
  ];

  store.employees.forEach((emp) => {
    const slip = store.payslips.find((p) => p.employee_id === emp.id && p.month_year === monthYear);
    const amount = slip ? slip.net_pay.toFixed(2) : '0.00';
    const codeNum = emp.emp_code.replace('EMP-', '');
    const ref = `NEFT-${monthYear.replace(/\s+/g, '')}-${codeNum}`;
    const remarks = `Salary ${monthYear}`;

    rows.push([
      `"${emp.first_name} ${emp.last_name}"`,
      `"${emp.bank_account_no}"`,
      `"${emp.bank_ifsc}"`,
      amount,
      ref,
      remarks
    ]);
  });

  return rows.map((r) => r.join(',')).join('\n');
}

/**
 * Get itemized Form-16 Indian Payslip for Employee
 */
export function getForm16Payslip(employeeId, monthYear = 'October 2026') {
  const store = getStore();
  const emp = store.employees.find((e) => e.id === employeeId || e.emp_code === employeeId);
  if (!emp) return null;

  const dept = store.departments.find((d) => d.id === emp.department_id);
  const desig = store.designations.find((d) => d.id === emp.designation_id);
  const sal = store.salaryStructures.find((s) => s.employee_id === emp.id);

  let slip = store.payslips.find((p) => p.employee_id === emp.id && p.month_year === monthYear);
  if (!slip && sal) {
    const calc = calculateStatutoryBreakdown(sal);
    const codeNum = emp.emp_code.replace('EMP-', '');
    slip = {
      id: `ps-${monthYear.replace(/\s+/g, '-')}-${codeNum}`,
      payslip_number: `PS-${monthYear.replace(/\s+/g, '-')}-${codeNum}`,
      payroll_batch_id: 'pb-current',
      employee_id: emp.id,
      month_year: monthYear,
      ...calc,
      status: 'ISSUED'
    };
  }

  if (!slip) return null;

  return {
    ...slip,
    employee_code: emp.emp_code,
    employee_name: `${emp.first_name} ${emp.last_name}`,
    email: emp.email,
    phone: emp.phone,
    department_name: dept ? dept.name : '',
    designation_title: desig ? desig.title : '',
    date_of_joining: emp.date_of_joining,
    pan: emp.pan,
    uan: emp.uan,
    bank_account_no: emp.bank_account_no,
    bank_ifsc: emp.bank_ifsc,
    bank_name: emp.bank_name,
    net_pay_words: numberToIndianWords(slip.net_pay)
  };
}
