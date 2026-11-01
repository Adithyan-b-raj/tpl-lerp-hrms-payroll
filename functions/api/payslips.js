/**
 * functions/api/payslips.js
 * Cloudflare Pages Function: Indian Form-16 Statutory Payslip API
 */

import { getForm16Payslip, getStore } from './_store.js';

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const store = getStore();
    const defaultEmpId = store.employees[0] ? store.employees[0].id : 'emp-1001';
    const employeeId = url.searchParams.get('employee_id') || defaultEmpId;
    const month = url.searchParams.get('month') || 'October 2026';

    const payslip = getForm16Payslip(employeeId, month);
    if (!payslip) {
      return new Response(JSON.stringify({
        error: 'Payslip not found for employee and month',
        employee_id: employeeId,
        month
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      payslip
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
