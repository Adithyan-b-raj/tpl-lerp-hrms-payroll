/**
 * functions/api/leave.js
 * Cloudflare Pages Function: Leave Requests & Approval Desk API
 */

import { getLeaveRequests, applyLeave, updateLeaveStatus, getStore } from './_store.js';

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employee_id');
    const status = url.searchParams.get('status');

    const requests = getLeaveRequests({ employee_id: employeeId, status });
    const store = getStore();

    let balances = store.leaveBalances;
    if (employeeId) {
      balances = balances.filter(b => b.employee_id === employeeId || b.employee_id === `emp-${employeeId.replace('EMP-', '')}`);
    }

    const formattedBalances = balances.map(b => {
      const type = store.leaveTypes.find(t => t.id === b.leave_type_id);
      return {
        ...b,
        type_code: type ? type.code : '',
        type_name: type ? type.name : ''
      };
    });

    return new Response(JSON.stringify({
      success: true,
      count: requests.length,
      requests,
      balances: formattedBalances,
      leave_types: store.leaveTypes
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

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();

    if (body.action === 'APPROVE' || body.action === 'REJECT') {
      const { request_id, action, approved_by } = body;
      if (!request_id) {
        return new Response(JSON.stringify({ error: 'request_id is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const res = updateLeaveStatus(request_id, action, approved_by);
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default: Apply for Leave
    const res = applyLeave(body);
    return new Response(JSON.stringify(res), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
