/**
 * functions/api/payroll.js
 * Cloudflare Pages Function: 1-Click Indian Statutory Payroll Engine & NEFT Export API
 */

import { runMonthlyPayroll, generateNeftDisbursementCsv, getStore } from './_store.js';

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const download = url.searchParams.get('download');
    const month = url.searchParams.get('month') || 'October 2026';

    if (download === 'neft') {
      const csvData = generateNeftDisbursementCsv(month);
      const safeMonth = month.replace(/[^a-zA-Z0-9]/g, '_');
      return new Response(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="NEFT_DISBURSEMENT_${safeMonth}.csv"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    const store = getStore();
    return new Response(JSON.stringify({
      success: true,
      batches: store.payrollBatches,
      current_batch: store.payrollBatches.find(b => b.month_year === month) || store.payrollBatches[0] || null
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
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const monthYear = body.month_year || 'October 2026';
    const processedBy = body.processed_by || 'Sneha Nambiar (HR Director)';

    const result = runMonthlyPayroll(monthYear, processedBy);

    return new Response(JSON.stringify({
      success: true,
      message: `Statutory payroll batch ${result.batch.batch_code} processed successfully for ${monthYear}.`,
      ...result
    }), {
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
