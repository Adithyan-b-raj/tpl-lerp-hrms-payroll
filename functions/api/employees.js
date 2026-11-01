/**
 * functions/api/employees.js
 * Cloudflare Pages Function: Employee Directory & Profiles API
 */

import { getEmployees, getEmployeeById } from './_store.js';

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || url.searchParams.get('emp_code');
    const departmentId = url.searchParams.get('department_id');
    const status = url.searchParams.get('status');

    if (id) {
      const employee = getEmployeeById(id);
      if (!employee) {
        return new Response(JSON.stringify({ error: 'Employee not found', id }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: true, employee }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    const employees = getEmployees({ department_id: departmentId, status });
    return new Response(JSON.stringify({ success: true, count: employees.length, employees }), {
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
