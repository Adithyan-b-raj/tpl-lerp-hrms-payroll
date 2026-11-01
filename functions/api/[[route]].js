/**
 * functions/api/[[route]].js
 * Health, Discovery & Overview API Route
 */

import { getStore, KOCHI_HQ_BEACON } from './_store.js';

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const path = url.pathname;

  const store = getStore();
  const activeCount = store.employees.filter(e => e.status === 'ACTIVE').length;
  const pendingLeaves = store.leaveRequests.filter(l => l.status === 'PENDING').length;
  const currentBatch = store.payrollBatches[store.payrollBatches.length - 1];

  return new Response(JSON.stringify({
    service: 'tpl-lerp-hrms-payroll',
    title: 'Enterprise HRMS, Geo-Attendance, Leave & Payroll Suite',
    status: 'healthy',
    movement: 'Movement R: Modern People-Ops Attendance HeatGrid & Statutory Payslip',
    archetype: {
      client: 'employee-self-service',
      admin: 'people-ops-admin'
    },
    beacon: KOCHI_HQ_BEACON,
    kpis: {
      total_employees: activeCount,
      pending_leave_approvals: pendingLeaves,
      latest_payroll_batch: currentBatch ? currentBatch.batch_code : null,
      monthly_gross_liability: currentBatch ? currentBatch.total_gross : 0,
      monthly_net_disbursement: currentBatch ? currentBatch.total_net : 0
    },
    endpoints: [
      { path: '/api/employees', methods: ['GET'], description: 'Employee directory and full profile' },
      { path: '/api/attendance', methods: ['GET', 'POST'], description: '30-day heatmap matrix & geo-clock punch' },
      { path: '/api/leave', methods: ['GET', 'POST'], description: 'Leave requests queue & balance operations' },
      { path: '/api/payroll', methods: ['GET', 'POST'], description: '1-click monthly statutory run & NEFT CSV export' },
      { path: '/api/payslips', methods: ['GET'], description: 'Form-16 Indian payslip with net pay in words' },
      { path: '/api/health', methods: ['GET'], description: 'Service health check' }
    ],
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=15, s-maxage=30'
    }
  });
}
