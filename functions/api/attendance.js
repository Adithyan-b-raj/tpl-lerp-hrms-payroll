/**
 * functions/api/attendance.js
 * Cloudflare Pages Function: 30-Day Attendance Matrix & Geo-Clock Punch API
 */

import { getAttendanceMatrix, recordPunch, KOCHI_HQ_BEACON } from './_store.js';

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const month = url.searchParams.get('month') || '2026-10';
    const employeeId = url.searchParams.get('employee_id');

    const matrix = getAttendanceMatrix(month, employeeId);
    return new Response(JSON.stringify({
      success: true,
      beacon: KOCHI_HQ_BEACON,
      ...matrix
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
    const { employee_id, type = 'CLOCK_IN', latitude, longitude, bypass_geofence } = body;

    if (!employee_id) {
      return new Response(JSON.stringify({ error: 'employee_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = recordPunch(employee_id, {
      type,
      latitude,
      longitude,
      bypassGeofence: Boolean(bypass_geofence)
    });

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
